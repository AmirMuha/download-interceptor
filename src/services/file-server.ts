'use server';

import { NextResponse } from 'next/server';
import { addLog } from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * Serves a remote file by fetching it and streaming it to the client.
 * @param requestUrl The original URL of the incoming request.
 * @param location The remote URL of the file to serve.
 * @returns A NextResponse streaming the file content or an error response.
 */
export async function serveRemoteFile(requestUrl: string, location:string): Promise<NextResponse> {
    try {
        const response = await fetch(location, { headers: { 'User-Agent': 'Local-Model-Interceptor/1.0' } });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        await addLog({ requestUrl, servedFile: location, status: 'success' });
        
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        if (response.headers.has('Content-Length')) {
             headers.set('Content-Length', response.headers.get('Content-Length')!);
        }
        
        try {
            const filename = path.basename(new URL(location).pathname);
            headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        } catch (e) {
            // Ignore if URL is not well-formed for pathname extraction, Content-Disposition will not be set
        }

        return new NextResponse(response.body, {
            status: 200,
            headers: headers,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown fetch error';
        await addLog({ requestUrl, servedFile: `${location} (Fetch Error: ${errorMessage})`, status: 'error' });
        return new NextResponse(`Error fetching from remote URL: ${location}. Reason: ${errorMessage}`, { status: 502 });
    }
}

/**
 * Serves a local file from the filesystem.
 * @param requestUrl The original URL of the incoming request.
 * @param location The local path of the file to serve.
 * @returns A NextResponse streaming the file content or an error response.
 */
export async function serveLocalFile(requestUrl: string, location: string): Promise<NextResponse> {
    const resolvedPath = path.resolve(process.cwd(), location);
    try {
        const stats = await fs.promises.stat(resolvedPath);
        if (!stats.isFile()) {
            throw new Error('Path is not a file');
        }

        const stream = fs.createReadStream(resolvedPath);
        const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

        await addLog({ requestUrl, servedFile: location, status: 'success' });

        return new NextResponse(webStream, {
            status: 200,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(stats.size),
                'Content-Disposition': `attachment; filename="${path.basename(location)}"`,
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error && 'code' in error && error.code === 'ENOENT' ? 'File not found' : 'Cannot read file';
        await addLog({ requestUrl, servedFile: `${location} (${errorMessage})`, status: 'error' });
        return new NextResponse(`${errorMessage} at: ${location}`, { status: 404 });
    }
}

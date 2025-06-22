'use server';

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * Serves a remote file by fetching it and streaming it to the client.
 * @param location The remote URL of the file to serve.
 * @returns A NextResponse streaming the file content.
 * @throws Will throw an error if the fetch fails or the response is not ok.
 */
export async function serveRemoteFile(location:string): Promise<NextResponse> {
    const response = await fetch(location, { headers: { 'User-Agent': 'Local-Model-Interceptor/1.0' } });

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText} from ${location}`);
    }
    
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
}

/**
 * Serves a local file from the filesystem.
 * @param location The local path of the file to serve.
 * @returns A NextResponse streaming the file content.
 * @throws Will throw an error if the file is not found or cannot be read.
 */
export async function serveLocalFile(location: string): Promise<NextResponse> {
    const resolvedPath = path.resolve(process.cwd(), location);
    
    const stats = await fs.promises.stat(resolvedPath);
    if (!stats.isFile()) {
        throw new Error('Path is not a file');
    }

    const stream = fs.createReadStream(resolvedPath);
    const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
        status: 200,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(stats.size),
            'Content-Disposition': `attachment; filename="${path.basename(location)}"`,
        },
    });
}

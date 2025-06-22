import { type NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { addLog } from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

async function handler(req: NextRequest) {
    const config = await getConfig();
    const requestUrl = req.url;

    const matchingRule = config.rules.find(rule => {
        const urlToCompare = rule.ignoreQueryParams ? requestUrl.split('?')[0] : requestUrl;
        return urlToCompare.startsWith(rule.sourceUrlPrefix);
    });

    if (!matchingRule) {
        await addLog({ requestUrl, servedFile: 'N/A - No matching rule', status: 'error' });
        return new NextResponse('No matching interception rule found.', { status: 404 });
    }

    const location = matchingRule.localFilePath;

    // Check if the location is a remote URL
    if (location.startsWith('http://') || location.startsWith('https://')) {
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
                // Ignore if URL is not well-formed for pathname extraction
            }

            return new NextResponse(response.body, {
                status: 200,
                headers: headers,
            });
        } catch (error) {
            const errorMessage = (error as Error).message;
            await addLog({ requestUrl, servedFile: `${location} (Fetch Error: ${errorMessage})`, status: 'error' });
            return new NextResponse(`Error fetching from remote URL: ${location}`, { status: 502 });
        }
    } else {
        // Handle as a local file path
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
            const errorMessage = (error as Error).code === 'ENOENT' ? 'File not found' : 'Cannot read file';
            await addLog({ requestUrl, servedFile: `${location} (${errorMessage})`, status: 'error' });
            return new NextResponse(`${errorMessage} at: ${location}`, { status: 404 });
        }
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as HEAD };

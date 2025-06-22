import { type NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { addLog } from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

async function handler(req: NextRequest) {
    const config = await getConfig();
    const requestUrl = req.url;

    const matchingRule = config.rules.find(rule => requestUrl.startsWith(rule.sourceUrlPrefix));

    if (!matchingRule) {
        await addLog({ requestUrl, servedFile: 'N/A - No matching rule', status: 'error' });
        return new NextResponse('No matching interception rule found.', { status: 404 });
    }

    const pathSuffix = requestUrl.substring(matchingRule.sourceUrlPrefix.length);
    const decodedPathSuffix = decodeURIComponent(pathSuffix);
    
    // Normalize to prevent directory traversal attacks using encoded characters.
    const safePathSuffix = path.normalize(decodedPathSuffix).replace(/^(\.\.(\/|\\|$))+/, '');
    const localFilePath = path.join(matchingRule.localDirectory, safePathSuffix);

    // Security check: Ensure the resolved path is within the intended directory.
    const resolvedBaseDir = path.resolve(matchingRule.localDirectory);
    const resolvedFilePath = path.resolve(localFilePath);
    
    if (!resolvedFilePath.startsWith(resolvedBaseDir)) {
        await addLog({ requestUrl, servedFile: `Forbidden: ${localFilePath}`, status: 'error' });
        return new NextResponse('Forbidden: Access denied.', { status: 403 });
    }

    try {
        const stats = await fs.promises.stat(localFilePath);
        if (!stats.isFile()) {
            throw new Error('Path is not a file');
        }

        const stream = fs.createReadStream(localFilePath);
        const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

        await addLog({ requestUrl, servedFile: localFilePath, status: 'success' });

        return new NextResponse(webStream, {
            status: 200,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(stats.size),
                'Content-Disposition': `attachment; filename="${path.basename(localFilePath)}"`,
            },
        });
    } catch (error) {
        const errorMessage = (error as Error).code === 'ENOENT' ? 'File not found' : 'Cannot read file';
        await addLog({ requestUrl, servedFile: `${localFilePath} (${errorMessage})`, status: 'error' });
        return new NextResponse(`${errorMessage} at: ${localFilePath}`, { status: 404 });
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as HEAD };

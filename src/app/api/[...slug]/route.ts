'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { addLog } from '@/lib/logger';
import { serveLocalFile, serveRemoteFile } from '@/services/file-server';

function reconstructUrl(slug: string[]): string | null {
    if (!slug || slug.length === 0) {
        return null;
    }
    let url = slug.join('/');
    if (url.startsWith('https:/') && !url.startsWith('https://')) {
        url = url.replace('https:/', 'https://');
    } else if (url.startsWith('http:/') && !url.startsWith('http://')) {
        url = url.replace('http:/', 'http://');
    }
    
    try {
        new URL(url);
        return url;
    } catch {
        return null;
    }
}

async function handler(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const targetUrl = reconstructUrl(params.slug);
    
    if (!targetUrl) {
        return new NextResponse('Invalid or missing proxy URL in the path. URL must start with http:/ or https:/', { status: 400 });
    }

    const config = await getConfig();

    const matchingRule = config.rules.find(rule => {
        if (!rule.sourceUrlPrefix || typeof rule.sourceUrlPrefix !== 'string') return false;
        try { new URL(rule.sourceUrlPrefix); } catch { return false; }

        const urlToCompare = rule.ignoreQueryParams ? targetUrl.split('?')[0] : targetUrl;
        return urlToCompare.startsWith(rule.sourceUrlPrefix);
    });

    if (matchingRule) {
        // --- Intercepted request ---
        const { localFilePath: location } = matchingRule;

        if (!location) {
            await addLog({ requestUrl: targetUrl, servedFile: 'N/A - Rule has no location', status: 'error' });
            return new NextResponse('Matching rule is missing a file path or URL.', { status: 500 });
        }

        const isRemote = location.startsWith('http://') || location.startsWith('https://');

        try {
            const response = isRemote ? await serveRemoteFile(location) : await serveLocalFile(location);
            await addLog({ requestUrl: targetUrl, servedFile: location, status: 'success' });
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await addLog({ requestUrl: targetUrl, servedFile: `${location} (Error: ${errorMessage})`, status: 'error' });
            const status = (error as any).code === 'ENOENT' ? 404 : 502;
            return new NextResponse(`Error serving file: ${errorMessage}`, { status });
        }

    } else {
        // --- Proxied request ---
        try {
            const response = await serveRemoteFile(targetUrl);
            await addLog({ requestUrl: targetUrl, servedFile: `${targetUrl} (proxied)`, status: 'success' });
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown proxy error';
            await addLog({ requestUrl: targetUrl, servedFile: `${targetUrl} (Proxy Error: ${errorMessage})`, status: 'error' });
            return new NextResponse(`Error proxying request: ${errorMessage}`, { status: 502 });
        }
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as HEAD };

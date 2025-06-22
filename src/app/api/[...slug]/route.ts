'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { addLog } from '@/lib/logger';
import { serveLocalFile, serveRemoteFile } from '@/services/file-server';

/**
 * Main request handler for all methods.
 * This route intercepts requests and serves files based on configured rules.
 */
async function handler(req: NextRequest) {
    const config = await getConfig();
    const requestUrl = req.url;

    const matchingRule = config.rules.find(rule => {
        // Ensure sourceUrlPrefix is valid before proceeding
        if (!rule.sourceUrlPrefix || typeof rule.sourceUrlPrefix !== 'string') return false;
        try {
            // This validation is to prevent app crashes if rule is not a valid URL prefix
            new URL(rule.sourceUrlPrefix); 
        } catch {
            return false;
        }

        const urlToCompare = rule.ignoreQueryParams ? requestUrl.split('?')[0] : requestUrl;
        return urlToCompare.startsWith(rule.sourceUrlPrefix);
    });

    if (!matchingRule) {
        await addLog({ requestUrl, servedFile: 'N/A - No matching rule', status: 'error' });
        return new NextResponse('No matching interception rule found.', { status: 404 });
    }

    const { localFilePath: location } = matchingRule;

    if (!location) {
         await addLog({ requestUrl, servedFile: 'N/A - Rule has no location', status: 'error' });
         return new NextResponse('Matching rule is missing a file path or URL.', { status: 500 });
    }

    const isRemote = location.startsWith('http://') || location.startsWith('https://');

    if (isRemote) {
        return serveRemoteFile(requestUrl, location);
    } else {
        return serveLocalFile(requestUrl, location);
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as HEAD };

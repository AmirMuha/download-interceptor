import { NextResponse, type NextRequest } from 'next/server';
import { getConfig, saveConfig, type Config } from '@/lib/config';
import { z } from 'zod';

const configSchema = z.object({
  rules: z.array(
    z.object({
      id: z.string(),
      sourceUrlPrefix: z.string().url(),
      localFilePath: z.string().min(1, { message: "Local file path is required." }),
    })
  ),
});

export async function GET() {
  const config = await getConfig();
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedConfig = configSchema.parse(body);
    await saveConfig(validatedConfig as Config);
    return NextResponse.json({ message: 'Configuration saved successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid configuration data', errors: error.errors }, { status: 400 });
    }
    console.error('Failed to save config:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

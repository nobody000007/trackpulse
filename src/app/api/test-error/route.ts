import { NextResponse } from 'next/server';
import { logger } from '@/backend/lib/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'info';

  if (type === 'exception') {
    const err = new Error('Intentional test exception for Application Insights validation');
    logger.error('Test exception triggered', err, { source: 'test-error-endpoint' });
    return NextResponse.json({ triggered: 'exception', message: err.message }, { status: 500 });
  }

  if (type === 'warn') {
    logger.warn('Test warning triggered', { source: 'test-error-endpoint' });
    return NextResponse.json({ triggered: 'warning' });
  }

  logger.info('Test info log triggered', { source: 'test-error-endpoint', type });
  logger.event('TestErrorEndpointCalled', { type });
  return NextResponse.json({ triggered: 'info' });
}

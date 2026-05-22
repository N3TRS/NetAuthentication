import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { MetricsInterceptor } from 'src/metrics/metrics.interceptor';
import { MetricsService } from 'src/metrics/metrics.service';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let mockEndTimer: jest.Mock;
  let metricsService: any;

  beforeEach(async () => {
    mockEndTimer = jest.fn();
    metricsService = {
      httpRequestDuration: {
        startTimer: jest.fn().mockReturnValue(mockEndTimer),
      },
      httpRequestsTotal: {
        inc: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsInterceptor,
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    interceptor = module.get<MetricsInterceptor>(MetricsInterceptor);
  });

  const buildContext = (path: string, routePath?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          path,
          method: 'GET',
          url: path,
          route: routePath ? { path: routePath } : undefined,
        }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    }) as ExecutionContext;

  const buildHandler = (): CallHandler => ({
    handle: jest.fn().mockReturnValue(of({})),
  });

  it('debe omitir el registro de métricas cuando el path es /metrics', async () => {
    const context = buildContext('/metrics');
    const handler = buildHandler();

    const result$ = interceptor.intercept(context, handler);
    await lastValueFrom(result$);

    expect(metricsService.httpRequestDuration.startTimer).not.toHaveBeenCalled();
    expect(metricsService.httpRequestsTotal.inc).not.toHaveBeenCalled();
  });

  it('debe registrar duración y contador para rutas normales con route definido', async () => {
    const context = buildContext('/auth/signin', '/auth/signin');
    const handler = buildHandler();

    const result$ = interceptor.intercept(context, handler);
    await lastValueFrom(result$);

    expect(metricsService.httpRequestDuration.startTimer).toHaveBeenCalledWith({
      method: 'GET',
      route: '/auth/signin',
    });
    expect(mockEndTimer).toHaveBeenCalled();
    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith({
      method: 'GET',
      status: 200,
      route: '/auth/signin',
    });
  });

  it('debe usar req.url como route cuando req.route no está disponible', async () => {
    const context = buildContext('/unknown-path');
    const handler = buildHandler();

    const result$ = interceptor.intercept(context, handler);
    await lastValueFrom(result$);

    expect(metricsService.httpRequestDuration.startTimer).toHaveBeenCalledWith({
      method: 'GET',
      route: '/unknown-path',
    });
    expect(metricsService.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ route: '/unknown-path' }),
    );
  });
});

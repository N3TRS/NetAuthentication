jest.mock('prom-client', () => ({
  Registry: jest.fn().mockImplementation(() => ({
    contentType: 'text/plain; version=0.0.4',
    metrics: jest.fn().mockResolvedValue('# metrics output'),
  })),
  Counter: jest.fn().mockImplementation(() => ({ inc: jest.fn() })),
  Histogram: jest.fn().mockImplementation(() => ({
    startTimer: jest.fn().mockReturnValue(jest.fn()),
  })),
  collectDefaultMetrics: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import { MetricsService } from 'src/metrics/metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('debe inicializar el Registry, Counter e Histogram en el constructor', () => {
    expect(Registry).toHaveBeenCalled();
    expect(collectDefaultMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ register: service.registry }),
    );
    expect(Counter).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'http_requests_total' }),
    );
    expect(Histogram).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'http_request_duration_seconds' }),
    );
  });

  it('debe exponer registry, httpRequestsTotal y httpRequestDuration como propiedades públicas', () => {
    expect(service.registry).toBeDefined();
    expect(service.httpRequestsTotal).toBeDefined();
    expect(service.httpRequestDuration).toBeDefined();
  });
});

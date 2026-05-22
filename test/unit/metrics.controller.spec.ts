import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from 'src/metrics/metrics.controller';
import { MetricsService } from 'src/metrics/metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  const mockMetricsOutput = '# HELP http_requests_total Total HTTP requests\n# TYPE http_requests_total counter';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: {
            registry: {
              contentType: 'text/plain; version=0.0.4',
              metrics: jest.fn().mockResolvedValue(mockMetricsOutput),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  describe('getMetrics', () => {
    it('debe establecer el Content-Type y retornar el contenido del registry', async () => {
      const mockRes = {
        set: jest.fn(),
        end: jest.fn(),
      };

      await controller.getMetrics(mockRes as any);

      expect(mockRes.set).toHaveBeenCalledWith('Content-Type', 'text/plain; version=0.0.4');
      expect(mockRes.end).toHaveBeenCalledWith(mockMetricsOutput);
    });
  });
});

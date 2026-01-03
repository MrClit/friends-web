import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';

/**
 * Swagger decorator for standard wrapped responses: { data: T }
 * Use this instead of @ApiResponse for successful responses that return data
 *
 * @param status - HTTP status code (200, 201, etc.)
 * @param description - Description of the response
 * @param model - Optional: Entity/DTO class for the data property
 *
 * @example
 * // Single entity response
 * @ApiStandardResponse(200, 'Event retrieved successfully', Event)
 *
 * // Array response
 * @ApiStandardResponse(200, 'Events retrieved successfully', Event, true)
 *
 * // Generic object (no model)
 * @ApiStandardResponse(200, 'Data retrieved successfully')
 */
export const ApiStandardResponse = <TModel extends Type<any>>(
  status: number,
  description: string,
  model?: TModel,
  isArray = false,
) => {
  const decorators: Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  > = [];

  // Add model to Swagger if provided
  if (model) {
    decorators.push(ApiExtraModels(model));
  }

  // Build schema for wrapped response
  let dataSchema: Record<string, any>;
  if (model) {
    if (isArray) {
      dataSchema = {
        type: 'array',
        items: { $ref: getSchemaPath(model) },
      };
    } else {
      dataSchema = { $ref: getSchemaPath(model) };
    }
  } else {
    dataSchema = { type: 'object' };
  }

  decorators.push(
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          data: dataSchema,
        },
      },
    }),
  );

  return applyDecorators(...decorators);
};

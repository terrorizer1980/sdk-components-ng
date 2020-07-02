import { SzResolvedEntity } from '@senzing/rest-api-client-ng';

export function bestEntityName(entity: SzResolvedEntity): string {
  if (!entity) return "[undefined]";
  if (entity.bestName && entity.bestName.trim().length > 0) {
    return entity.bestName.trim();
  }
  if (entity.entityName && entity.entityName.trim().length > 0) {
    return entity.entityName.trim();
  }
  if (entity.nameData && entity.nameData.length > 0 && entity.nameData[0].trim().length > 0) {
    return entity.nameData[0].trim();
  }
  if (entity.identifierData && entity.identifierData.findIndex(s => s.toUpperCase().startsWith("EMAIL:")) >= 0)
  {
    return entity.identifierData.find(s => s.toUpperCase().startsWith("EMAIL:"))
      .substring("EMAIL:".length).trim();
  }
  return "[Entity " + entity.entityId + "]";
}

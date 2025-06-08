import { EntityMetadata, getConnection } from 'typeorm';

export class EntityAdapter {
    private mappings: { [key: string]: { [key: string]: string } };

    constructor() {
        this.mappings = {};
    }

    registerMapping(entityName: string, mapping: { [key: string]: string }) {
        this.mappings[entityName] = mapping;
    }

    mapRawToEntity<T>(entityName: string, rawData: any[]): T[] {
        if (!this.mappings[entityName]) {
            throw new Error(`No mappings registered for entity: ${entityName}`);
        }

        const mapping = this.mappings[entityName];

        return rawData.map(item => {
            const mappedItem: any = {};
            for (const key in mapping) {
                if (mapping.hasOwnProperty(key) && item.hasOwnProperty(mapping[key])) {
                    mappedItem[key] = item[mapping[key]];
                }
            }
            return mappedItem as T;
        });
    }

    registerMappingFromEntity(entity: Function) {
        const connection = getConnection();
        const metadata: EntityMetadata = connection.getMetadata(entity);

        const mapping: { [key: string]: string } = {};
        console.log('EntityAdapter::registerMappingFromEntity()/metadata.name:', metadata.name)
        // console.log('EntityAdapter::registerMappingFromEntity()/metadata.columns:', metadata.columns)
        metadata.columns.forEach(column => {
            // console.log('EntityAdapter::registerMappingFromEntity()/column:', column)
            console.log('EntityAdapter::registerMappingFromEntity()/column.databaseName:', column.databaseName)
            mapping[column.propertyName] = column.databaseName;
        });

        console.log('EntityAdapter::registerMappingFromEntity()/mapping:', mapping)
        this.registerMapping(metadata.name, mapping);
    }

    getEntityName(entity: Function): string {
        const connection = getConnection();
        const metadata: EntityMetadata = connection.getMetadata(entity);
        return metadata.name;
    }

    public getDbSelect(entityName: string, selectFields: string[]): string[] {
        // Check if the entity has a registered mapping
        if (!this.mappings[entityName]) {
            throw new Error(`No mappings registered for entity: ${entityName}`);
        }
    
        const mapping = this.mappings[entityName];
    
        // Transform the select fields into their corresponding database column names
        const dbSelect = selectFields.map(field => {
            if (!mapping[field]) {
                throw new Error(`Field "${field}" does not exist in the registered mapping for entity: ${entityName}`);
            }
            return mapping[field];
        });
    
        return dbSelect;
    }
    
}

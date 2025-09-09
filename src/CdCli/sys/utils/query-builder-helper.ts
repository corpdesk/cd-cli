import { SelectQueryBuilder, Repository, Like, ObjectLiteral } from 'typeorm';
import { EntityAdapter } from './entity-adapter.js';
import { IServiceInput, QueryInput } from '../base/i-base.js';

export class QueryBuilderHelper {
  entityAdapter: EntityAdapter;

  constructor(private repository: Repository<any>) {
    this.entityAdapter = new EntityAdapter();
  }

  test(query, queryBuilder) {
    if (query.where && Array.isArray(query.where) && query.where.length > 0) {
      console.log('QueryBuilderHelper::createQueryBuilder/04:');
      query.where.forEach((condition, index) => {
        const key = Object.keys(condition)[0];
        console.log('QueryBuilderHelper::createQueryBuilder/key:', key);
        const value = condition[key];
        console.log('QueryBuilderHelper::createQueryBuilder/value:', value);
        console.log(
          'QueryBuilderHelper::createQueryBuilder/value._type:',
          value._type,
        );

        const dbField = `${this.repository.metadata.name}.${this.getDatabaseColumnName(key)}`;

        if (value._type === 'like') {
          let likeValue = value._value; // Extract the value inside Like()
          // Remove any extra quotes around the value
          if (likeValue.startsWith("'") && likeValue.endsWith("'")) {
            likeValue = likeValue.slice(1, -1);
          }
          queryBuilder.orWhere(`${dbField} LIKE :${key}`, { [key]: likeValue });
        } else {
          const operator = index === 0 ? 'where' : 'orWhere';
          queryBuilder[operator](`${dbField} = :${key}`, { [key]: value });
        }
      });
    } else if (
      query.where &&
      typeof query.where === 'object' &&
      this.isEmptyObject(query.where)
    ) {
      console.log('QueryBuilderHelper::createQueryBuilder/05:');
      // Do not add any where clause
    }
  }

  transformWhereClause(where: any): any {
    console.log('QueryBuilderHelper::transformWhereClause()/01');
    console.log('QueryBuilderHelper::transformWhereClause()/where:', where);
    if (Array.isArray(where)) {
      console.log('QueryBuilderHelper::transformWhereClause()/where:', where);
      console.log('QueryBuilderHelper::transformWhereClause()/02');
      return where.map((condition) => {
        console.log('QueryBuilderHelper::transformWhereClause()/03');
        console.log(
          'QueryBuilderHelper::transformWhereClause()/condition:',
          condition,
        );
        const field = Object.keys(condition)[0];
        console.log('QueryBuilderHelper::transformWhereClause()/04');
        const value = condition[field];
        console.log('QueryBuilderHelper::transformWhereClause()/05');
        if (
          typeof value === 'string' &&
          value.startsWith('Like(') &&
          value.endsWith(')')
        ) {
          console.log('QueryBuilderHelper::transformWhereClause()/06');
          const match = value.match(/^Like\((.*)\)$/);
          console.log(
            'QueryBuilderHelper::transformWhereClause()/value:',
            value,
          );
          console.log(
            'QueryBuilderHelper::transformWhereClause()/match:',
            match,
          );
          console.log('QueryBuilderHelper::transformWhereClause()/07');
          if (match) {
            console.log('QueryBuilderHelper::transformWhereClause()/08');
            const param = match[1];
            console.log(
              'QueryBuilderHelper::transformWhereClause()/param:',
              param,
            );
            const ret = { [field]: Like(param) };
            console.log('QueryBuilderHelper::transformWhereClause()/ret:', ret);
            return ret;
          }
        }
        console.log('QueryBuilderHelper::transformWhereClause()/09');
        return condition;
      });
    }
    console.log('QueryBuilderHelper::transformWhereClause()/10');
    return where;
  }

  transformQueryInput(query: QueryInput): QueryInput {
    const w = this.transformWhereClause(query.where);
    console.log('QueryBuilderHelper::transformQueryInput()/w:', w);
    return {
      ...query,
      where: w,
    };
  }

  createQueryBuilder(
    serviceInput: IServiceInput<ObjectLiteral>,
  ): SelectQueryBuilder<any> {
    const query = serviceInput.cmd?.query;
    const queryBuilder = this.repository.createQueryBuilder(
      this.repository.metadata.name,
    );

    // Handling SELECT clause
    if (query?.select && query.select.length > 0) {
      this.entityAdapter.registerMappingFromEntity(serviceInput.serviceModel);
      const selectDB = this.entityAdapter.getDbSelect(
        this.repository.metadata.name,
        query.select,
      );
      queryBuilder.select(selectDB);
    } else {
      const allColumns = this.repository.metadata.columns.map(
        (column) => `${this.repository.metadata.name}.${column.databaseName}`,
      );
      queryBuilder.select(allColumns);
    }

    // Apply DISTINCT if specified
    if (query?.distinct) {
      queryBuilder.distinct(true);
    }

    // Handling WHERE clause
    if (query?.where) {
      if (
        typeof query.where === 'object' &&
        !Array.isArray(query.where) &&
        !this.isEmptyObject(query.where)
      ) {
        this.processObjectWhereClause(queryBuilder, query.where);
      } else if (Array.isArray(query.where) && query.where.length > 0) {
        this.processArrayWhereClause(queryBuilder, query.where);
      }
    }

    // Handling TAKE and SKIP clauses
    if (query?.take) {
      queryBuilder.take(query.take);
    }

    if (query?.skip) {
      queryBuilder.skip(query.skip);
    }

    return queryBuilder;
  }

  /**
     * Example of comparison usage
     * 
     * const query: IQuery = {
            update: {
                coopStatEnabled: true,
            },
            where: {
                'coopStatDate%BETWEEN': { start: '2024-01-01', end: '2024-06-30' },
            },
        };
        
     * const query: IQuery = {
            update: {
                coopStatDisplay: false,
            },
            where: {
                'coopStatDate%>': '2024-07-01',
                'cdGeoLocationId%=': 102,
            },
        };
     * @param queryBuilder 
     * @param where 
     */
  private processObjectWhereClause(
    queryBuilder: SelectQueryBuilder<any>,
    where: any,
  ): void {
    Object.keys(where).forEach((key, index) => {
      const [field, operator] = key.split('%'); // Split field and operator
      const dbField = `${this.repository.metadata.name}.${this.getDatabaseColumnName(field)}`;
      const value = where[key];

      const sqlOperator = this.getSqlOperator(operator); // Map symbol to SQL operator
      const condition =
        operator === 'BETWEEN' && typeof value === 'object'
          ? `${dbField} BETWEEN :${field}Start AND :${field}End`
          : `${dbField} ${sqlOperator} :${field}`;

      const params =
        operator === 'BETWEEN' && typeof value === 'object'
          ? { [`${field}Start`]: value.start, [`${field}End`]: value.end }
          : { [field]: value };

      if (index === 0) {
        queryBuilder.where(condition, params);
      } else {
        queryBuilder.andWhere(condition, params);
      }
    });
  }

  // Example SQL operator mapper
  private getSqlOperator(symbol: string): string {
    const operatorMap = {
      '>': '>',
      '<': '<',
      '=': '=',
      BETWEEN: 'BETWEEN',
      LIKE: 'LIKE',
    };
    return operatorMap[symbol] || '=';
  }

  processArrayWhereClause2(queryBuilder: SelectQueryBuilder<any>, where: any) {
    console.log('QueryBuilderHelper::processArrayWhereClause2/04:');
    console.log('QueryBuilderHelper::processArrayWhereClause2/where:', where);
    let strWhere = JSON.stringify(where);
    console.log(
      'QueryBuilderHelper::processArrayWhereClause2/where1:',
      strWhere,
    );
    const a = `:"Like\\(`; // Escape the '(' character
    const b = `')"}`;
    const regex = new RegExp(a, 'g');
    strWhere = strWhere.replace(regex, b);
    console.log(
      'QueryBuilderHelper::processArrayWhereClause2/strWhere:',
      strWhere,
    );
    where = JSON.parse(strWhere);
    console.log('QueryBuilderHelper::processArrayWhereClause2/where2:', where);
    where.forEach((condition, index) => {
      const key = Object.keys(condition)[0];
      console.log('QueryBuilderHelper::processArrayWhereClause2/key:', key);
      const value = condition[key];
      console.log('QueryBuilderHelper::processArrayWhereClause2/value:', value);
      console.log(
        'QueryBuilderHelper::processArrayWhereClause2/value._type:',
        value._type,
      );

      const dbField = `${this.repository.metadata.name}.${this.getDatabaseColumnName(key)}`;

      if (value._type === 'like') {
        let likeValue = value._value; // Extract the value inside Like()
        console.log(
          'QueryBuilderHelper::processArrayWhereClause2/likeValue:',
          likeValue,
        );
        // Remove any extra quotes around the value
        if (likeValue.startsWith("'") && likeValue.endsWith("'")) {
          likeValue = likeValue.slice(1, -1);
        }
        console.log(
          'QueryBuilderHelper::processArrayWhereClause2/`${dbField} LIKE :${key}`:',
          `${dbField} LIKE :${key}`,
        );
        console.log(
          'QueryBuilderHelper::processArrayWhereClause2/{ [key]: likeValue }:',
          { [key]: likeValue },
        );
        queryBuilder.orWhere(`${dbField} LIKE :${key}`, { [key]: likeValue });
      } else {
        const operator = index === 0 ? 'where' : 'orWhere';
        queryBuilder[operator](`${dbField} = :${key}`, { [key]: value });
      }
    });
  }

  private processArrayWhereClause(
    queryBuilder: SelectQueryBuilder<any>,
    whereArray: any[],
  ): void {
    console.log('QueryBuilderHelper::processArrayWhereClause()/01');
    console.log(
      'QueryBuilderHelper::processArrayWhereClause()/whereArray:',
      whereArray,
    );
    whereArray.forEach((condition, index) => {
      const key = Object.keys(condition)[0];
      const value = condition[key];
      const dbField = `${this.repository.metadata.name}.${this.getDatabaseColumnName(key)}`;
      console.log('QueryBuilderHelper::processArrayWhereClause()/key:', key);
      console.log(
        'QueryBuilderHelper::processArrayWhereClause()/value:',
        value,
      );
      console.log(
        'QueryBuilderHelper::processArrayWhereClause()/dbField:',
        dbField,
      );
      console.log('QueryBuilderHelper::processArrayWhereClause()/02');
      if (
        typeof value === 'string' &&
        value.startsWith('Like(') &&
        value.endsWith(')')
      ) {
        console.log('QueryBuilderHelper::processArrayWhereClause()/03');
        const match = value.match(/^Like\((.*)\)$/);
        console.log(
          'QueryBuilderHelper::processArrayWhereClause()/dbField:',
          dbField,
        );
        if (match) {
          console.log('QueryBuilderHelper::processArrayWhereClause()/04');
          console.log(
            'QueryBuilderHelper::processArrayWhereClause()/match:',
            match,
          );
          let likeValue = match[1];
          console.log(
            'QueryBuilderHelper::processArrayWhereClause()/likeValue:',
            likeValue,
          );
          if (likeValue.startsWith("'") && likeValue.endsWith("'")) {
            likeValue = likeValue.slice(1, -1);
          }
          if (index === 0) {
            console.log('QueryBuilderHelper::processArrayWhereClause()/05');
            console.log(
              'QueryBuilderHelper::processArrayWhereClause()/likeValue:',
              likeValue,
            );
            console.log(
              'QueryBuilderHelper::processArrayWhereClause()/`${dbField} LIKE :${key}`:',
              `${dbField} LIKE :${key}`,
            );
            console.log(
              'QueryBuilderHelper::processArrayWhereClause()/{ [key]: likeValue }:',
              { [key]: likeValue },
            );
            queryBuilder.where(`${dbField} LIKE :${key}`, { [key]: likeValue });
          } else {
            console.log('QueryBuilderHelper::processArrayWhereClause()/06');
            console.log(
              'QueryBuilderHelper::processArrayWhereClause()/`${dbField} LIKE :${key}`:',
              `${dbField} LIKE :${key}`,
            );
            console.log(
              'QueryBuilderHelper::processArrayWhereClause()/{ [key]: likeValue }:',
              { [key]: likeValue },
            );
            queryBuilder.orWhere(`${dbField} LIKE :${key}`, {
              [key]: likeValue,
            });
          }
        }
      } else {
        console.log('QueryBuilderHelper::processArrayWhereClause()/07');
        if (index === 0) {
          console.log('QueryBuilderHelper::processArrayWhereClause()/08');
          console.log(
            'QueryBuilderHelper::processArrayWhereClause()/`${dbField} LIKE :${key}`:',
            `${dbField} LIKE :${key}`,
          );
          console.log(
            'QueryBuilderHelper::processArrayWhereClause()/{ [key]: likeValue }:',
            { [key]: value },
          );
          queryBuilder.where(`${dbField} = :${key}`, { [key]: value });
        } else {
          console.log('QueryBuilderHelper::processArrayWhereClause()/09');
          console.log(
            'QueryBuilderHelper::processArrayWhereClause()/`${dbField} LIKE :${key}`:',
            `${dbField} LIKE :${key}`,
          );
          console.log(
            'QueryBuilderHelper::processArrayWhereClause()/{ [key]: likeValue }:',
            { [key]: value },
          );
          queryBuilder.orWhere(`${dbField} = :${key}`, { [key]: value });
        }
      }
    });
  }

  private getDatabaseColumnName(field: string): string {
    const column = this.repository.metadata.findColumnWithPropertyName(field);
    return column ? column.databaseName : field;
  }

  isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
  }

  addJSONSelect(jsonField: string, keys: string[]): this {
    const queryBuilder = this.repository.createQueryBuilder(
      this.repository.metadata.name,
    );
    keys.forEach((key) => {
      queryBuilder.addSelect(
        `JSON_UNQUOTE(JSON_EXTRACT(${jsonField}, '$.${key}'))`,
        key,
      );
    });
    return this;
  }

  updateJSONField(jsonField: string, updates: Record<string, any>): this {
    // Use UpdateQueryBuilder for updating
    const queryBuilder = this.repository
      .createQueryBuilder()
      .update(this.repository.metadata.name);

    // Construct the JSON_SET update expression
    const updateFields = Object.keys(updates)
      .map((key) => `JSON_SET(${jsonField}, '$.${key}', '${updates[key]}')`)
      .join(', ');

    // Use set() properly with UpdateQueryBuilder
    queryBuilder.set({ [jsonField]: () => updateFields });

    return this;
  }
}

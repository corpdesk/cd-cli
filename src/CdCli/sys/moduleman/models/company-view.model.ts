import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'company_view',
  synchronize: false,
  expression: `
    SELECT
        company.company_id AS company_id,
        company.company_guid AS company_guid,
        company.company_type_guid AS company_type_guid,
        company.directory_category_guid AS directory_category_guid,
        company.company_name AS company_name,
        company.postal_address AS postal_address,
        company.phone AS phone,
        company.mobile AS mobile,
        company.email AS email,
        company.website AS website,
        company.physical_location AS physical_location,
        company.city AS city,
        company.country AS country,
        company.logo AS logo,
        company.company_enabled AS company_enabled,
        company.doc_id AS doc_id,
        company.city_guid AS city_guid,
        company.county_guid AS county_guid,
        company.company_guid AS company_guid,
        company.company_description AS company_description,
        company.parent_guid AS parent_guid,
        company.consumer_guid AS consumer_guid,
        company.search_tags AS search_tags,
        company_type.company_type_name AS company_type_name
    FROM
        (
            company_type
            JOIN company ON ((
                company_type.company_type_guid = company.company_type_guid
        )))
    `,
})
export class CompanyViewModel {
  @ViewColumn({
    name: 'company_id',
  })
  companyId!: number;

  @ViewColumn({
    name: 'company_guid',
  })
  companyGuid!: number;

  @ViewColumn({
    name: 'company_name',
  })
  companyName!: string;

  @ViewColumn({
    name: 'company_type_guid',
  })
  companyTypeGuid!: string;

  @ViewColumn({
    name: 'directory_category_guid',
  })
  directoryCategoryGuid!: number;

  @ViewColumn({
    name: 'company_type_name',
  })
  companyTypeName!: string;

  @ViewColumn({
    name: 'postal_address',
  })
  postalAddress!: string;

  @ViewColumn({
    name: 'phone',
  })
  phone!: string;

  @ViewColumn({
    name: 'mobile',
  })
  mobile!: string;

  @ViewColumn({
    name: 'email',
  })
  email!: string;

  @ViewColumn({
    name: 'website',
  })
  website!: string;

  @ViewColumn({
    name: 'physical_location',
  })
  physicalLocation!: string;

  @ViewColumn({
    name: 'city',
  })
  city!: string;

  @ViewColumn({
    name: 'country',
  })
  country!: string;

  @ViewColumn({
    name: 'logo',
  })
  logo!: string;

  @ViewColumn({
    name: 'company_enabled',
  })
  companyEnabled!: boolean | number | null;

  @ViewColumn({
    name: 'doc_id',
  })
  docId!: number;

  @ViewColumn({
    name: 'city_guid',
  })
  cityGuid!: string;

  @ViewColumn({
    name: 'county_guid',
  })
  countyGuid!: string;

  @ViewColumn({
    name: 'company_description',
  })
  company_description!: string;

  @ViewColumn({
    name: 'parent_guid',
  })
  parentGuid!: string;

  @ViewColumn({
    name: 'consumer_guid',
  })
  consumerGuid!: string;

  @ViewColumn({
    name: 'search_tags',
  })
  searchTags!: string;
}

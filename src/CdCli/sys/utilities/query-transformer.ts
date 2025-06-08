import { Like } from 'typeorm';

export class QueryTransformer {
    /**
     * Transforms an array of objects with stringified Like() syntax into TypeORM-compatible objects.
     *
     * @param conditions Array of objects with fields in the format {"fieldName": "Like('%value%')"}.
     * @returns Array of objects with fields transformed to { fieldName: Like('%value%') }.
     */
    static transformLikeConditions(conditions: any[]): any[] {
        return conditions.map(condition => {
            const transformedCondition: any = {};
            for (const [key, value] of Object.entries(condition)) {
                if (typeof value === 'string') {
                    // Check if the value matches the Like function pattern
                    const match = value.match(/^Like\((['"`])(%.*?%)\1\)$/);
                    if (match) {
                        transformedCondition[key] = Like(match[2]); // Use TypeORM Like function with the captured value
                    } else {
                        transformedCondition[key] = value; // Keep the original value if not a Like function
                    }
                } else {
                    transformedCondition[key] = value; // Handle non-string values
                }
            }
            return transformedCondition;
        });
    }

    static transformQuery(q: any): { searchTerm: string; searchFields: string[] } {
        console.log("QueryTransformer::transformQuery()/q:", q);
        const where = q.where || [];
        const searchFields: string[] = [];
        let searchTerm: string | null = null;

        where.forEach((condition: Record<string, string>) => {
            for (const [field, value] of Object.entries(condition)) {
                // Adjusted regex for 'Like(%term%)'
                const match = value.match(/Like\(%(.+)%\)/);
                if (match) {
                    if (!searchTerm) {
                        searchTerm = match[1]; // Extract the search term
                    } else if (searchTerm !== match[1]) {
                        throw new Error("Inconsistent search terms found in the query");
                    }
                    searchFields.push(field); // Collect the field name
                }
            }
        });

        if (!searchTerm) {
            throw new Error("No valid search term found in the query");
        }

        return {
            searchTerm,
            searchFields,
        };
    }
}

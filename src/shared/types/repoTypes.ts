
export type PropertyFilters = Partial<{
    city: string;
    minPrice: string;
    maxPrice: string;
    propertyName: string;
    limit: number;
    offset: number;
}>;

export type PropertyCount = { total: number, pending: number, totalViewed: number};
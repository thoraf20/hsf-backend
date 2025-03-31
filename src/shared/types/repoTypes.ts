import { SeekPaginationOption } from "./paginate";

export enum SortDateBy {
    RecentlyAdded = "rescently_added",
    LastUpdated = "last_updated",
    Earliest = "earliest",
} 

export enum propertyStatusFilter {
    Sold = "sold",
    Pending = "pending",
    Available = "available"
}

export type PropertyFilters = Partial<{
    sortBy: SortDateBy
    property_type: string;
    property_status: propertyStatusFilter;
    bedrooms: string;
    bathrooms: string;
    financing_type: string; // "Outright,mortgage,installment" or "select_all"
    property_features: string; // "ac,cctv"
    min_price: string;
    max_price: string;
    city: string;
} & SeekPaginationOption >;

export type PropertyCount = { total: number, pending: number, totalViewed: number};
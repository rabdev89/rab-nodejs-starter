
export interface GetFilters {
    id?: string | number;
    limit?: string;
    offset?: string;
    sortBy?: any;
    sortOrder?: string;
    includeInactive?: string | boolean;
}

export interface IncludeInactive {
    includeInactive?: string;
}

export interface UsersFilters extends GetFilters {
    userId?: string | number;
}

import * as Errors from "../errors";
import config from "../config";
import { GetFilters } from "../entities/filter";

const codes = Errors.codes.filters;

export class Filters {

    /*
     * @param filterParams - query filter params
     * @param defaultSortBy - default value for "sortBy" filter
     * @param defaultSortOrder - default value for "sortOrder" filter
     * @param defaultOffset - default value for "offset" filter
     * @param defaultLimit - default value for "limit" filter
     */
    public static factory(filterParams: GetFilters,
                          defaultSortBy?: any,
                          defaultSortOrder?: string,
                          defaultOffset?: number,
                          defaultLimit?: number,
                          total?: number) {
        return new Filters(filterParams, defaultSortBy, defaultSortOrder, defaultOffset, defaultLimit, total);
    }

    public static inArray(findValue: any, inArray: any[]): boolean {
        let result: boolean = false;
        for (let i = 0; i <= inArray.length; i++) {
            if (inArray[i] === undefined) {
                continue;
            }
            if (inArray[i] === findValue) {
                result = true;
                break;
            }
        }
        return result;
    }

    public static isObjectEmpty(inObject: object): boolean {
        if (inObject instanceof Object) {
            if (Object.keys(inObject).length > 0) {
                return false;
            }
        }
        return true;
    }

    public static checkObjectKeys(findValues: string[],
                                  inObject: object,
                                  identical?: boolean,
                                  notFound?: string[]): boolean {
        if (notFound === undefined) {
            notFound = [];
        }
        const keys: string[] = Object.keys(inObject);
        let result: boolean = true;
        if (identical === true) {
            if (keys.length !== findValues.length) {
                return false;
            }
        }
        keys.forEach((key) => {
            if (!Filters.inArray(key, findValues)) {
                result = false;
                notFound.push(key);
            }
        });
        return result;
    }

    public static escapeString(value: string) {
        const inputRaw = value.trim().replace(/(_|%|\\)/g, "\\$1");
        return inputRaw;
    }

    public filterParams: GetFilters;
    public sortBy: string = "createdAt";
    public sortByModel: object = {};
    public sortOrder: string = "desc";
    public sortByConfig: string[] = []; // sortBy filter possible values
    public limit: number;
    public limitMax: number = 50;
    public offset: number;
    public total: number;
    public logging: boolean | CallableFunction;
    public attributes: any[];
    public orderConfig: object = {};
    public filters: object = {}; // sequelize FindOptions object
    public needIncludeInactive: boolean = true;

    /*
     * @param filterParams - query filter params
     * @param defaultSortBy - default value for "sortBy" filter
     * @param defaultSortOrder - default value for "sortOrder" filter
     * @param defaultOffset - default value for "offset" filter
     * @param defaultLimit - default value for "limit" filter
     */
    constructor(filterParams: GetFilters,
                defaultSortBy?: any,
                defaultSortOrder?: string,
                defaultOffset?: number,
                defaultLimit?: number,
                total?: number) {
        this.filterParams = filterParams;
        if (defaultSortBy !== undefined) {
            this.sortBy = defaultSortBy;
        }
        if (defaultSortOrder !== undefined) {
            this.sortOrder = defaultSortOrder;
        }
        if (defaultOffset !== undefined) {
            this.offset = defaultOffset;
        }
        if (defaultLimit !== undefined) {
            this.limit = Number(defaultLimit);
        }
        if (total !== undefined) {
            this.total = total;
        }
    }

    /*
     * Get all filter options
     *
     * @return sequelize FindOptions
     */
    public getAll(): object {
        this.getId();
        this.getOffset();
        this.getLimit();
        this.getSortOrder();
        this.getAttributes();
        this.getLogging();
        return this.filters;
    }

    /*
     * Get basic sequelize filter options
     *
     * @return sequelize FindOptions
     */
    public getBasic(): object {
        this.getOffset();
        this.getLimit();
        this.getSortOrder();
        this.getAttributes();
        this.getLogging();
        return this.filters;
    }

    /*
     * Get sequelize filter options for count
     *
     * @return sequelize FindOptions
     */
    public getCount(): object {
        this.getId();
        this.getAttributes();
        this.getLogging();
        return this.filters;
    }

    /*
     * Get basic sequelize filter options for count
     *
     * @return sequelize FindOptions
     */
    public getBasicCount(): object {
        this.getId();
        this.getAttributes();
        this.getLogging();
        return this.filters;
    }

    /*
     * Replace specific values in request query filters
     *
     * @param name - filter name in request query
     * @param fromValue - target value
     * @param toValue - new value
     */
    public replaceIn(name: string, fromValue: string, toValue: string): this {
        if (this.filterParams[name] !== undefined && this.filterParams[name] === fromValue) {
            this.filterParams[name] = toValue;
        }
        return this;
    }

    public renameIndex(from: string, to: string): this {
        if (this.filterParams[from] !== undefined) {
            this.filterParams[to] = this.filterParams[from];
            delete this.filterParams[from];
        }
        return this;
    }

    public getSortOrder(): this {
        if (this.filterParams && this.filterParams.sortOrder !== undefined) {
            this.sortOrder = this.filterParams.sortOrder.toLowerCase();
        }
        if (this.filterParams && this.filterParams.sortBy !== undefined) {
            this.sortBy = this.filterParams.sortBy;
            const inArray = Filters.inArray(this.sortBy, this.sortByConfig);
            if (this.sortByConfig.length > 0 && !inArray) {
                throw new Errors.BadRequest(codes.error10001001);
            }
        }
        if (this.sortByModel[this.sortBy] !== undefined) {
            const sort = this.sortByModel[this.sortBy];
            this.filters["order"] = [];
            if (Array.isArray(sort.sortBy)) {
                for (const column of sort.sortBy) {
                    this.filters["order"].push([sort.model, column, this.sortOrder]);
                }
            } else {
                this.filters["order"] = [[sort.model, sort.sortBy, this.sortOrder]];
            }
        } else {
            let order: any[] = [];
            if (this.orderConfig[this.sortBy] !== undefined) {
                order = this.orderConfig[this.sortBy];
            } else {
                order.push(this.sortBy);
            }
            order.push(this.sortOrder);
            this.filters["order"] = [order];
            if (this.filters["order"] === undefined) {
                this.filters["order"] = [[this.sortBy, this.sortOrder]];
            }
        }
        return this;
    }

    public getId(): this {
        if (this.filterParams && this.filterParams.id !== undefined) {
            if (this.filterParams.id) {
                this.setWhere("id", this.filterParams.id);
            }
        }
        return this;
    }

    /*
     * Get sequelize filter options
     *
     * @return sequelize FindOptions
     */
    public getParams(): object {
        return this.filters;
    }

    public getOffset(): this {
        if (this.filterParams && this.filterParams.offset !== undefined) {
            this.offset = Number(this.filterParams.offset);
        }
        if (this.total !== undefined && this.offset >= this.total) {
            this.offset = 0;
        }
        if (this.offset > -1) {
            this.filters["offset"] = this.offset;
        }
        return this;
    }

    public getLimit(): this {
        if (this.filterParams && this.filterParams.limit !== undefined) {
            this.limit = Number(this.filterParams.limit);
        }
        if (this.limit === undefined) {
            return this;
        } else if (Number(this.limit) < 1) {
            throw new Errors.BadRequest(codes.error10001003);
        } else if (Number(this.limit) > this.limitMax) {
            throw new Errors.ValidationError("limit can`t be more than " + this.limitMax, codes.error10001004.code);
        } else {
            this.filters["limit"] = this.limit;
        }
        return this;
    }

    public getAttributes(): this {
        if (this.attributes) {
            this.filters["attributes"] = this.attributes;
        }
        return this;
    }

    public getLogging(): this {
        if (this.logging !== undefined && (typeof this.logging === "boolean" || typeof this.logging === "function")) {
            this.filters["logging"] = this.logging;
        }
        return this;
    }

    public setOneFilter(name: string): this {
        if (this.filterParams && this.filterParams[name] !== undefined) {
            this.filters[name] = this.filterParams[name];
        }
        return this;
    }

    /*
     * Set Include filter
     *
     * @param name - filter name in request query
     * @param dbName - field name in db table
     * @param defaultValue - default value
     */
    public setIncludeFilter(name: string, dbName: string, defaultValue?: boolean): this {
        if (this.filterParams && this.filterParams[name] !== undefined &&
            ["true", "false"].indexOf(String(this.filterParams[name]).toLowerCase()) > -1) {
            this.setWhere(dbName, String(this.filterParams[name]).toLowerCase());
        } else if (defaultValue) {
            this.setWhere(dbName, defaultValue);
        }
        return this;
    }

    /*
     * Set where filter
     *
     * @param name - filter name in request query
     * @param dbName - field name in db table
     */
    public setWhereFilter(name: string, dbName?: string): this {
        if (dbName === undefined) {
            dbName = name;
        }
        if (this.filterParams && this.filterParams[name] !== undefined) {
            this.setWhere(dbName, this.filterParams[name]);
        }
        return this;
    }

    /*
     * Set where more then filter
     *
     * @param name - filter name in request query
     * @param fieldName - field name in db table
     */
    public setWhereMoreThenFilter(name: string, fieldName?: string): this {
        if (fieldName === undefined) {
            fieldName = name;
        }
        if (this.filterParams && this.filterParams[name] !== undefined) {
            this.filters["where"] = this.filters["where"] || {};
            this.filters["where"][fieldName] = { $gte: this.filterParams[name] };
        }
        return this;
    }

    /*
     * Set where less then filter
     *
     * @param name - filter name in request query
     * @param fieldName - field name in db table
     */
    public setWhereLessThenFilter(name: string, fieldName?: string): this {
        if (fieldName === undefined) {
            fieldName = name;
        }
        if (this.filterParams && this.filterParams[name] !== undefined) {
            this.filters["where"] = this.filters["where"] || {};
            this.filters["where"][fieldName] = { $lte: this.filterParams[name] };
        }
        return this;
    }

    /*
     * Set where in filter, special for string values like - "1,2,3"
     *
     * @param name - filter name in request query
     * @param dbName - field name in db table
     */
    public setWhereInFilter(name: string, dbName?: string): this {
        if (dbName === undefined) {
            dbName = name;
        }
        if (this.filterParams && this.filterParams[name] !== undefined) {
            this.setWhereIn(dbName, String(this.filterParams[name]).split(","));
        }
        return this;
    }

    /*
     * Set where filter to included model
     *
     * @param name - filter name in request query
     * @param modelAlias - alias name of target model from included models
     * @param fieldName - field name in db table
     */
    public setWhereFilterInModel(name: string, modelAlias: string, fieldName: string): this {
        for (const model of this.filters["include"]) {
            if (model.as === modelAlias) {
                if (this.filterParams && this.filterParams[name] !== undefined) {
                    model.where = { [fieldName]: this.filterParams[name] };
                }
            }
            if ("include" in model) {
                this.addWhereFilterToModel(name, model.include, modelAlias, fieldName);
            }
            if ("through" in model) {
                if (model.through.as === modelAlias) {
                    if (this.filterParams && this.filterParams[name] !== undefined) {
                        model.through.where = { [fieldName]: this.filterParams[name] };
                    }
                }
            }
        }
        return this;
    }

    /*
     * Recursive search of target model
     *
     * @param name - filter name in request query
     * @param models - alias name of target model from included models
     * @param modelAlias - alias name of target model from included models
     * @param fieldName - field name in db table
     */
    public addWhereFilterToModel(name: string, models: any[], modelAlias: string, fieldName: string): void {
        if (!Array.isArray(models)) {
            return;
        }
        for (const model of models) {
            if (model.as === modelAlias) {
                if (this.filterParams && this.filterParams[name] !== undefined) {
                    model.where = { [fieldName]: this.filterParams[name] };
                }
            }
            if ("include" in model) {
                this.addWhereFilterToModel(name, model.include, modelAlias, fieldName);
            }
            if ("through" in model) {
                if (model.through.as === modelAlias) {
                    if (this.filterParams && this.filterParams[name] !== undefined) {
                        model.through.where = { [fieldName]: this.filterParams[name] };
                    }
                }
            }
        }
    }

    public setSearchEnumFilter(name: string, dbNames: string[]): this {
        if (!this.filterParams[name] || !dbNames.length) {
            return this;
        }
        this.filters["where"] = this.filters["where"] || {};
        const whereNames: object[] = [];
        for (const dbName of dbNames) {
            const obj = {};
            obj[dbName] = this.filterParams[name];
            whereNames.push(obj);
        }
        this.filters["where"].$or = whereNames;
        return this;
    }

    public setOne(name: string, value: any): this {
        this.filters[name] = value;
        return this;
    }

    public getWhere(name: string): this {
        if (this.filterParams && this.filterParams[name] !== undefined) {
            this.setWhere(name, this.filterParams[name]);
        }
        return this;
    }

    /*
     * Set where filter directly to sequelize FindOptions
     *
     * @param name - filter name in sequelize FindOptions
     * @param value - filter value
     */
    public setWhere(fieldName: string, value: any): this {
        if (this.filters["where"] === undefined) {
            this.filters["where"] = {};
        }
        this.filters["where"][fieldName] = value;
        return this;
    }

    /*
     * Set where filter to included model
     *
     * @param fieldName - db field name or Symbol like $or, $not
     * @param modelAlias - alias name of target model from included models
     * @param value - db field value
     */
    public setWhereInModel(fieldName: any, modelAlias: string, value: any): this {
        for (const model of this.filters["include"]) {
            if (model.as === modelAlias) {
                if (model["where"] === undefined) {
                    model["where"] = {};
                }
                model["where"][fieldName] = value;
            }
            if ("include" in model) {
                this.addWhereToModel(fieldName, model.include, modelAlias, value);
            }
            if ("through" in model) {
                if (model.through.as === modelAlias) {
                    model.through.where = model.through.where || {};
                    model.through.where[fieldName] = value;
                }
            }
        }
        return this;
    }

    /*
     * Recursive search of target model
     *
     * @param fieldName - db field name  or Symbol like $or, $not
     * @param models - alias name of target model from included models
     * @param modelAlias - alias name of target model from included models
     * @param value - db field value
     */
    public addWhereToModel(fieldName: any, models: any[], modelAlias: string, value: any): void {
        if (!Array.isArray(models)) {
            return;
        }
        for (const model of models) {
            if (model.as === modelAlias) {
                if (model["where"] === undefined) {
                    model["where"] = {};
                }
                model["where"][fieldName] = value;
            }
            if ("include" in model) {
                this.addWhereToModel(fieldName, model.include, modelAlias, value);
            }
            if ("through" in model) {
                if (model.through.as === modelAlias) {
                    model.through.where = model.through.where || {};
                    model.through.where[fieldName] = value;
                }
            }
        }
    }

    /*
     * Set where in filter directly to sequelize FindOptions
     *
     * @param name - filter name in sequelize FindOptions
     * @param value - filter values
     */
    public setWhereIn(name: string, values: any[]): this {
        if (this.filters["where"] === undefined) {
            this.filters["where"] = {};
        }
        this.filters["where"][name] = {
            $in: values,
        };
        return this;
    }

    /*
     * Set included models directly to sequelize FindOptions
     *
     * @param name - filter name in sequelize FindOptions
     * @param value - filter values
     */
    public setInclude(models: any[]): this {
        if (this.filters["include"] === undefined) {
            this.filters["include"] = [];
        }
        this.filters["include"] = models;
        return this;
    }

    /*
     * Add to included models directly to sequelize FindOptions
     *
     * @param name - filter name in sequelize FindOptions
     * @param value - filter values
     */
    public addToInclude(models: any[]): this {
        if (this.filters["include"] === undefined) {
            this.filters["include"] = [];
        }
        this.filters["include"] = this.filters["include"].concat(models);
        return this;
    }

    /*
     * Set where filter between two dates
     *
     * @param fieldName - field in db table with date type for search
     * @param dateFromName - start date filter name in request query
     * @param dateToName - end date filter name in request query
     */
    public setDateFromToFilter(fieldName: string, dateFromName: string, dateToName: string): this {
        const setTimeBetweenCreatedAt: object = {};
        if (this.filterParams[dateFromName]) {
            setTimeBetweenCreatedAt["$gte"] = String(this.filterParams[dateFromName]).trim();
        }
        if (this.filterParams[dateToName]) {
            setTimeBetweenCreatedAt["$lte"] = String(this.filterParams[dateToName]).trim();
        }
        if (Object.keys(setTimeBetweenCreatedAt).length > 0) {
            this.setWhere(fieldName, setTimeBetweenCreatedAt);
        }
        return this;
    }

    /*
     * Set sortBy possible values config
     *
     * @param values - sortBy filter possible values
     */
    public setSortByConfig(values: any[]): this {
        this.sortByConfig = values;
        return this;
    }

    /*
     * Set "sortBy" query filter to specific model
     *
     * @param name - sortBy query filter value
     * @param dbName - db field name for sorting by
     * @param sortModel - sequelize model object where to sortBy needs to be
     */
    public setSortByModel(name: string, dbName: string | string[], sortModel: any): this {
        this.sortByModel[name] = {
            model: sortModel,
            sortBy: dbName,
        };
        return this;
    }

    /*
     * Set "sortBy" query filter to specific db field name
     *
     * @param name - sortBy query filter value
     * @param dbName - db field name for sorting by
     */
    public setSortBy(name: string, dbName: string): this {
        if (this.filterParams && this.filterParams.sortBy === name) {
            this.filterParams.sortBy = dbName;
        }
        return this;
    }

    /*
     * Set "sortBy" filter to specific model
     *
     * @param name - sortBy query filter value
     * @param value - sequelize model with db field name for sorting by in array,
     * like - [ model, "original_field_name" ]
     */
    public setOrderConfig(name: string, value: any[]): this {
        this.orderConfig[name] = value;
        return this;
    }

    /*
     * Set attributes to sequelize FindOptions, to select only some attributes
     *
     * @param value - array of attributes
     */
    public setAttributes(value: any[]): this {
        this.attributes = value;
        return this;
    }

    /*
     * Set group by directly to sequelize FindOptions
     *
     * @param value - array of group by attributes
     */
    public setGroupBy(value: string): this {
        if (this.filters["group"] === undefined) {
            this.filters["group"] = [];
        }
        this.filters["group"].push(value);
        return this;
    }


}

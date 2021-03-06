import {ColumnDef, BucketInfo} from "./ColumnLike";

export interface Row {
    data(): any
    isDetail(): boolean
    isHidden(): boolean
    toggleHide(hide?:boolean): void
    isSelected(): boolean
    get(columnDef: ColumnDef):any
    getByColTag(colTag: string):any
    toggleSelect(select?:boolean): void
    sectorPath(): string[]
    setSectorPath(sp:string[])
}

export abstract class GenericRow implements Row {

    private _data:any;
    private _sectorPath:string[];
    private _isSelected:boolean = false;
    private _isHidden:boolean = false;

    constructor(data:any) {
        this._data = data;
        this._sectorPath = [];
    }

    get(columnDef: ColumnDef):any {
        return this._data[columnDef.colTag];
    }

    getByColTag(colTag: string):any {
        return this._data[colTag];
    }

    toggleSelect(select?:boolean): void {
        if (typeof select !== "undefined")
            this._isSelected =  select;
        else
            this._isSelected = !this._isSelected;
    }

    isSelected(): boolean {
        return this._isSelected;
    }

    isHidden() {
        return this._isHidden;
    }

    toggleHide(hide?:boolean) {
        if (typeof hide !== "undefined")
            this._isHidden = hide;
        else
            this._isHidden = !this._isHidden;
    }

    sectorPath():string[] {
        return this._sectorPath;
    }

    setSectorPath(sectorPath:string[]) {
        this._sectorPath = sectorPath;
    }

    data():any {
        return this._data
    }

    setData(data:any) {
        this._data = data;
    }

    abstract isDetail(): boolean;

}

export class DetailRow extends GenericRow {

    constructor(data:any) {
        super(data);
    }

    isDetail():boolean {
        return true
    }

}

export class SubtotalRow extends GenericRow {

    public detailRows:DetailRow[];
    private children:SubtotalRow[] = [];
    private childrenByTitle:{ [title: string] : SubtotalRow; } = {};
    private _isCollapsed:boolean = false;
    public bucketInfo:BucketInfo;

    toggleCollapse(state?:boolean) {
        if (state != undefined)
            this._isCollapsed = state;
        else
            this._isCollapsed = !this._isCollapsed;
    }

    isCollapsed():boolean {
        return this._isCollapsed;
    }

    isDetail():boolean {
        return false;
    }

    private findIndex(child:SubtotalRow) {
        for (var i = 0; i < this.children.length; i++)
            if (this.children[i].bucketInfo.title === child.bucketInfo.title)
                return i;
        return -1;
    }

    constructor(bucketInfo: BucketInfo) {
        super({});
        this.detailRows = [];
        this.bucketInfo = bucketInfo;
    }

    addChild(child:SubtotalRow) {
        // if already exist, pop it from the children array
        this.removeChild(child);
        this.children.push(child);
        this.childrenByTitle[child.bucketInfo.title] = child;
    }

    removeChild(child:SubtotalRow) {
        if (this.childrenByTitle[child.bucketInfo.title] != undefined) {
            const idx = this.findIndex(child);
            this.children.splice(idx, 1);
            this.childrenByTitle[child.bucketInfo.title] = undefined;
        }
    }

    getChildByTitle(title:string):SubtotalRow {
        return this.childrenByTitle[title];
    }

    getNumChildren():number {
        return this.children.length;
    }

    getChildren():SubtotalRow[] {
        return this.children;
    }

    getChildAtIndex(idx:number):SubtotalRow {
        return this.children[idx];
    }

    hasChildWithTitle(title:string):boolean {
        return this.getChildByTitle(title) != undefined;
    }

}

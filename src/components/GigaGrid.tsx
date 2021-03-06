import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import {ColumnDef, Column, FilterBy, ColumnFactory, ColumnGroupDef} from "../models/ColumnLike";
import {Row} from "../models/Row";
import {Tree} from "../static/TreeBuilder";
import {
    GigaStore,
    GigaAction,
    GigaActionType,
} from "../store/GigaStore";
import {Dispatcher} from "flux";
import {TableBody} from "./TableBody";
import {TableHeader} from "./TableHeader";
import {SettingsPopover} from "./toolbar/SettingsPopover";
import $ = require('jquery');
import ReactElement = __React.ReactElement;
import {InitializeAction} from "../store/reducers/InitializeReducer";
import {ChangeRowDisplayBoundsAction} from "../store/reducers/ChangeRowDisplayBoundsReducer";

/**
 * Interface that describe the shape of the `Props` that `GigaGrid` accepts from the user
 * the bare minimum are: `data` and `columnDefs`
 */
export interface GigaProps extends React.Props<GigaGrid> {

    /**
     * Initial set of SubtotalBy declarations, default to `[]`. If set, the grid will initialize
     * with the specified subtotals
     */
    initialSubtotalBys?:ColumnDef[]

    /**
     * Initial set of SortBy declarations, default to `[]`. If set, the grid will initialize
     * with the specified sorting order
     */
    initialSortBys?:Column[]

    initialFilterBys?:FilterBy[]

    /**
     * Callback that fires when a row is clicked, return `false` in the passed callback function to suppress
     * default behavior (highlights the row)
     * @param row the `Row` object associated with the row the user clicked on
     */
    onRowClick?:(row:Row, state:GigaState)=>boolean
    enableMultiRowSelect?:boolean

    /**
     * Callback that fires when a cell is clicked, return `false` in the passed callback function to suppress
     * default behavior
     *
     * Example
     *
     * ```js
     *
     * onCellClick = (row, columnDef) => {
     *  console.log(row.get(columnDef))
     *  // prints the value of the cell clicked on!
     * }
     *
     * ```
     * @param row
     * @param columnDef
     */
    onCellClick?:(row:Row, columnDef:Column)=>boolean

    /**
     * array of object literals representing the raw un-subtotaled data
     */
    data:any[]

    /**
     * array of [ColumnDef](_models_columnlike_.columndef.html) which defines the data type, header title
     * and other metadata about each column in `data`
     */
    columnDefs:ColumnDef[]
    columnGroups?:ColumnGroupDef[]
    bodyHeight?:string
    rowHeight?:string

    /**
     * EXPERIMENTAL - these props allow us to expand / select SubtotalRow on construction of the grid component
     */
    /**
     * sector paths to expand by default
     */
    initiallyExpandedSubtotalRows?:string[][]
    /**
     * sector paths to mark as "selected"
     */
    initiallySelectedSubtotalRows?:string[][]

    /**
     * custom classes
     */
    tableHeaderClass?:string
}

export interface GridSubcomponentProps<T> extends React.Props<T> {
    dispatcher: Dispatcher<GigaAction>;
}

/**
 * Interface that Declares the Valid State of GigaGrid
 * The grid's state consists of an `Tree` object that model the rows in a hierarchical structure (representing subtotals)
 *
 * `rasterizedRows` is a flattened version of `tree`. Each `Row` in `rasterizedRows` is converted into a `TableRow` component
 * at render time. (even though we represent subtotal-ed data as a tree in-memory, HTML tables must ultimately be rendered as a two-dimensional grid
 * and that is why `rasterizedRow` exists
 *
 * `displayStart`, `displayEnd` determines the range in `rasterizedRows` that is actually rendered as `tr` elements. This is the avoid needlessly rendering rows that will not be visible in the viewport
 *
 * `widthMeasures` contain state information on the width of each column and the table
 */
export interface GigaState {

    tree:Tree
    columns:Column[]
    subtotalBys:Column[]
    sortBys:Column[]
    filterBys:FilterBy[]

    /*
     the displayable view of the data in `tree`
     */
    rasterizedRows:Row[]
    displayStart:number
    displayEnd:number
    showSettingsPopover:boolean

     canvas:HTMLElement;
     viewport:HTMLElement;
}

/**
 * The root component of this React library. assembles raw data into `Row` objects which are then translated into their
 * virtual DOM representation
 *
 * The bulk of the table state is stored in `tree`, which contains subtotal and detail rows
 * Rows can be hidden if filtered out or sorted among other things, subtotal rows can be collapsed etc
 * mutations to the state of table from user initiated actions can be thought of as mutates on the `tree`
 *
 * **IMPORTANT** GigaGrid the component does not actually mutate its own state nor give its children the ability
 * to mutate its state. State mutation is managed entirely by the GigaStore flux Store. Events generated by the
 * children of this component are emitted to a central dispatcher and are dispatched to the GigaStore
 *
 * **Developer Warning** Please DO NOT pass a reference of this component to its children nor call setState() in the component
 **/

export class GigaGrid extends React.Component<GigaProps, GigaState> {

    private store:GigaStore;
    private dispatcher:Dispatcher<GigaAction>;

    static defaultProps:GigaProps = {
        initialSubtotalBys: [],
        initialSortBys: [],
        initialFilterBys: [],
        data: [],
        columnDefs: [],
        bodyHeight: "500px",
        rowHeight: "25px"
    };

    constructor(props:GigaProps) {
        super(props);
        this.dispatcher = new Dispatcher<GigaAction>();
        this.store = new GigaStore(this.dispatcher, props);
        this.state = this.store.getState();
        // do not call setState again, this is the only place! otherwise you are violating the principles of Flux
        // not that would be wrong but it would break the 1 way data flow and make keeping track of mutation difficult
        this.store.addListener(()=> {
            this.setState(this.store.getState());
        });
    }

    submitColumnConfigChange(action:GigaAction) {
        this.dispatcher.dispatch(action);
    }

    toggleSettingsPopover() {
        this.dispatcher.dispatch({
            type: GigaActionType.TOGGLE_SETTINGS_POPOVER
        });
    }

    renderSettingsPopover() {
        const state = this.store.getState();
        if (state.showSettingsPopover)
            return (
                <div>
                    <SettingsPopover
                        subtotalBys={state.subtotalBys}
                        columns={state.columns}
                        onSubmit={(action:GigaAction) => this.submitColumnConfigChange(action)}
                        onDismiss={()=>this.toggleSettingsPopover()}/>
                </div>);
        else
            return null;
    }

    render() {

        var columns:Column[][];
        const state = this.store.getState();
        if (this.props.columnGroups)
            columns = ColumnFactory.createColumnsFromGroupDefinition(this.props.columnGroups, state);
        else
            columns = [state.columns];

        const bodyStyle = {
            height: this.props.bodyHeight,
        };

        return (
            <div className="giga-grid">
                {this.renderSettingsPopover()}
                <div className="giga-grid-header-container">
                    <table className="header-table">
                        <TableHeader dispatcher={this.dispatcher} 
                                     columns={columns} 
                                     tableHeaderClass={this.props.tableHeaderClass} />
                    </table>
                </div>
                <div ref={c=>state.viewport=c}
                     onScroll={()=>this.dispatchDisplayBoundChange()}
                     className="giga-grid-body-viewport"
                     style={bodyStyle}>
                    <table ref={c=>state.canvas=c} className="giga-grid-body-canvas">
                        <TableBody dispatcher={this.dispatcher}
                                   rows={state.rasterizedRows}
                                   columns={columns[columns.length-1]}
                                   displayStart={state.displayStart}
                                   displayEnd={state.displayEnd}
                                   rowHeight={this.props.rowHeight}
                        />
                    </table>
                </div>
            </div>);
    }

    componentWillReceiveProps(nextProps:GigaProps) {
        var payload:InitializeAction = {
            type: GigaActionType.INITIALIZE,
            props: nextProps
        };
        this.dispatcher.dispatch(payload);
    }

    /**
     * on component update, we use jquery to align table headers
     * this is the "give up" solution, implemented in 0.1.7
     */
    componentDidUpdate() {
        this.synchTableHeaderWidthToFirstRow();
    }

    /**
     * yes this is still a thing!
     */
    synchTableHeaderWidthToFirstRow() {
        const node:Element = ReactDOM.findDOMNode<Element>(this);
        const $canvas = $(node).find("table.giga-grid-body-canvas");
        /*
         * EXPERIMENTAL, traverse parent DOM nodes until we find one whose width is not zero
         */
        const rootNodeWidth = findParentWidth(node);

        const canvasWidth = computeCanvasWidth($canvas, rootNodeWidth);
        $canvas.innerWidth(canvasWidth);
        $(node).find("table.header-table").innerWidth(canvasWidth);

        const $tableHeaders = $(node).find("th.table-header");
        const $firstRowInBody = $(node).find("tbody tr.placeholder-false:first td");
        _.chain($tableHeaders).zip($firstRowInBody).each((pair)=> {
            const $th = $(pair[0]);
            const $td = $(pair[1]);
            $th.innerWidth($td.innerWidth());
        }).value();
    }

    static horizontalScrollHandler() {
        const scrollLeftAmount:number = $('.giga-grid-body-viewport').scrollLeft();
        $('.giga-grid-header-container').scrollLeft(scrollLeftAmount);
    }

    componentDidMount() {
        /*
         * subscribe to window.resize
         */
        if (typeof window !== "undefined")
            window.addEventListener('resize', this.synchTableHeaderWidthToFirstRow.bind(this));

        /*
         re-compute displayStart && displayEnd
         */
        this.dispatchDisplayBoundChange();
        this.synchTableHeaderWidthToFirstRow();

        // Bind scroll listener to move headers when data container is srcolled
        $('.giga-grid-body-viewport').scroll(GigaGrid.horizontalScrollHandler)
    }

    componentWillUnmount() {
        // Unbind the scroll listener
        $('.giga-grid-body-viewport').unbind('scroll', GigaGrid.horizontalScrollHandler);
        /*
         * unsubscribe to window.resize
         */
        if (typeof window !== "undefined")
            window.removeEventListener('resize', this.synchTableHeaderWidthToFirstRow);
    }

    private dispatchDisplayBoundChange() {
        const state = this.store.getState();
        const $viewport = $(state.viewport);
        const $canvas = $(state.canvas);
        const action:ChangeRowDisplayBoundsAction = {
            type: GigaActionType.CHANGE_ROW_DISPLAY_BOUNDS,
            canvas: $canvas,
            viewport: $viewport,
            rowHeight: this.props.rowHeight
        };
        this.dispatcher.dispatch(action);
    }

}

/**
 * uber hax to get scrollbar width
 * see stackoverflow reference: http://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes
 * @returns {number}
 */
export function getScrollBarWidth() {

    var scrollBarWidth = null;

    function computeScrollBarWidth() {
        var inner = document.createElement('p');
        inner.style.width = "100%";
        inner.style.height = "200px";

        var outer = document.createElement('div');
        outer.style.position = "absolute";
        outer.style.top = "0px";
        outer.style.left = "0px";
        outer.style.visibility = "hidden";
        outer.style.width = "200px";
        outer.style.height = "150px";
        outer.style.overflow = "hidden";
        outer.appendChild(inner);

        document.body.appendChild(outer);
        var w1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        var w2 = inner.offsetWidth;
        if (w1 == w2) w2 = outer.clientWidth;

        document.body.removeChild(outer);
        return (w1 - w2);
    }

    if (scrollBarWidth === null)
        scrollBarWidth = computeScrollBarWidth();

    return scrollBarWidth;

}

/**
 * traverse the node until a viable parent with a non-zero width is found
 * stops until the node run out of parent (i.e. reaches the <html/> element
 * @param node
 * @returns {number}
 */
function findParentWidth(node:Element) {
    var rootNodeWidth = $(node).innerWidth();
    var $parent = $(node).parent();
    while ($parent && rootNodeWidth === 0) {
        rootNodeWidth = $parent.innerWidth();
        $parent = $parent.parent();
    }
    return rootNodeWidth;
}

/**
 * Computes the canvas (table)'s width given the root node of the grid's width
 * @param $canvas
 * @param rootNodeWidth
 * @returns {number}
 */
function computeCanvasWidth($canvas:JQuery, rootNodeWidth:number) {
    var canvasWidth = $canvas.innerWidth();
    if (rootNodeWidth > canvasWidth)
        canvasWidth = rootNodeWidth - getScrollBarWidth();
    return canvasWidth;
}
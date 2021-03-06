import {GigaState, GigaProps} from "../../components/GigaGrid";
import {GigaAction} from "../GigaStore";
import {Row, SubtotalRow} from "../../models/Row";
import {Column} from "../../models/ColumnLike";

export function cellSelectReducer(state:GigaState, action:ToggleCellSelectAction, props: GigaProps):GigaState {
    
    if (_.isFunction(props.onCellClick)) {
        if (!props.onCellClick(action.row, action.column))
            return state; // will not emit state mutation event
        else
            return _.clone(state); // will emit state mutation event
    } else
        return state;

}

export function rowSelectReducer(state:GigaState, action:ToggleRowSelectAction, props:GigaProps):GigaState {
    if (_.isFunction(props.onRowClick)) {
        const udfResult = props.onRowClick(action.row, state);
        if (udfResult !== undefined &&
            udfResult === false)
            return state;
        else {
            // de-select every other row unless enableMultiRowSelect is turned on
            if (!props.enableMultiRowSelect) {
                const toggleTo = !action.row.isSelected();
                recursivelyDeselect(state.tree.getRoot());
                action.row.toggleSelect(toggleTo);
            } else
                action.row.toggleSelect();
            return _.clone(state);
        }
    } else
        return state;

}

// define a function
function recursivelyDeselect(row:Row) {
    row.toggleSelect(false);
    if (!row.isDetail()) {
        const subtotalRow = (row as SubtotalRow);
        const children:Row[] = subtotalRow.getChildren().length === 0 ? subtotalRow.detailRows : subtotalRow.getChildren();
        children.forEach(child=>recursivelyDeselect(child));
    }
}

export interface ToggleRowSelectAction extends GigaAction {
    row:Row
}

export interface ToggleCellSelectAction extends GigaAction {
    row:Row
    column:Column
}

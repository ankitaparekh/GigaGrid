import * as React from 'react';
import Props = __React.Props;
import {TableRowColumnDef} from "../models/ColumnLike";
import {DropdownMenu} from "./dropdown/DropdownMenu";
import {SimpleDropdownMenuItem} from "./dropdown/DropdownMenu";
import {ColumnFormat} from "../models/ColumnLike";
import {SubtotalByMenuItem} from "./dropdown/StandardMenuItems";
import {SortMenuItem} from "./dropdown/StandardMenuItems";

export interface TableHeaderProps extends Props<TableHeader> {
    tableColumnDef: TableRowColumnDef;
    isFirstColumn?: boolean;
    isLastColumn?: boolean;
}

export class TableHeader extends React.Component<TableHeaderProps,any> {

    private dropdownMenuRef:DropdownMenu;

    constructor(props:TableHeaderProps) {
        super(props);
    }

    private renderDropdownMenu() {
        // TODO wire real event system to menu items, also write actually useful menu items
        return (
            <DropdownMenu ref={(c:DropdownMenu)=>this.dropdownMenuRef=c} alignLeft={this.props.isLastColumn}>
                <SortMenuItem tableRowColumnDef={this.props.tableColumnDef} isLastColumn={this.props.isLastColumn}/>
                <SubtotalByMenuItem tableRowColumnDef={this.props.tableColumnDef} isLastColumn={this.props.isLastColumn}/>
            </DropdownMenu>
        );
    }

    private renderHeaderAddon() {
        if (this.props.isFirstColumn)
            return null;

        return (
            <span style={{position:"relative"}}>
                &nbsp;
                <i className="fa fa-bars dropdown-menu-toggle-handle" onClick={e=>this.dropdownMenuRef.toggleDisplay()}/>
                {this.renderDropdownMenu()}
            </span>
        );
    }

    render() {

        const columnDef = this.props.tableColumnDef;

        return (
            <th className={columnDef.format === ColumnFormat.NUMBER ? "numeric" : "non-numeric"}>
                {columnDef.title || columnDef.colTag}
                {this.renderHeaderAddon()}
            </th>
        );
    }
}
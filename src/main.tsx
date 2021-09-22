import * as React from "react";
import * as moment from 'moment';

import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

import {Table 
    ,TableBody
    ,TableCell
    ,TableContainer
    ,TableHead
    ,TableRow
    ,TableSortLabel
    ,Paper
    ,ClickAwayListener
    ,Collapse
    ,Box
    ,IconButton
    ,Typography } from '@material-ui/core/';

import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import 'date-fns';

import InputForm from './components/InputForm';
import DeleteForm from './components/DeleteForm';

export interface State {
    rows?: any[] | any,
    columns?: any[] | any,
    columnHeaders?: any | any,
    validations?: any[] | any,
    outcomeTypes?: any[] | any,
    nextActionTypes?: any[] | any,
    fieldNames?: any[] | any,
    endpoints?: any[] | any
}

export const initialState: State = {
    rows: [],
    columns: [],
    columnHeaders: {},
    validations: [],
    outcomeTypes: [],
    nextActionTypes: [],
    fieldNames: [],
    endpoints: []
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    visuallyHidden: {
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        top: 20,
        width: 1,
    },
    sortIcon: {
        color: '#fff !important'
    }
  }),
);


function Row(props) {
    const { row, rowIndex, columns, formatDate, outcomeTypes, nextActionTypes, PathwayKeys, fieldNames, endpoints } = props;
    const [open, setOpen] = React.useState(false);

    const handleClickAway = (e) => {
        setOpen(false);
    };

    const handleClick = () => {
        setOpen(!open)
    }

    let rowData = {}
    columns.map((column, colIndex) => rowData[column.displayName] = (column.type.dateTime ? Date.parse(row[colIndex]) : row[colIndex]))

    /**
     * Helper functions to determine if row is validated and whether it's the same user, this is then used to control the background colour
     * isValidated and isSameUser then PINK
     * isValidated and not isSameUser then YELLOW
     * else alternate grey and white
     */
    const isValidated = (row) => {
        if (row[row.length - 1].length === 0) return false //no validations
        let latestValidation = row[row.length - 1][0]
        return Date.parse(latestValidation["OutcomeDate"]) >= rowData["ValidationStartDate"]
    }

    const isSameUser = (row) => {
        let latestValidation = row[row.length - 1][0]
        return rowData["User"].split("@")[0] === latestValidation["OutcomeBy"] 
    }

    return (
        <React.Fragment>
            <TableRow key={row[0]} style={{height: 10, background: (isValidated(row) ? (isSameUser(row) ? "#FF7EF0" : "#F0FF7E") : rowIndex % 2 ? "#eeeded" : "white") }}>
                <TableCell style={{padding: "2px 8px", height: 'auto !important'}}>
                    {row[row.length - 1].length > 0 ? (
                        <IconButton aria-label="expand row" size="small" onClick={handleClick}>
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    ) : (
                        <InputForm 
                            update={Main.update} 
                            outcomeTypes={outcomeTypes} 
                            nextActionTypes={nextActionTypes} 
                            pathwayKey={row[0]} 
                            rowData={rowData} 
                            expandRow={setOpen} 
                            rowOpen={open} 
                            PathwayKeys={PathwayKeys}
                            addValidationEndpoint={endpoints.addValidation}
                        />
                    )
                    }
                </TableCell>
                {row.slice(0,row.length-1).map((cell, colIndex) => (
                        // Hide these columns
                        [fieldNames.key, fieldNames.user, "ValidationStartDate", "ValidationEndDate"].indexOf(columns[colIndex].displayName) === -1  &&
                        <TableCell
                            align={columns[colIndex].type.numeric || columns[colIndex].type.integer ? 'right' : 'left'} 
                            style={{
                                padding: "2px 8px", 
                                height: 'auto !important', 
                                whiteSpace: "nowrap",
                                maxWidth: "350px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >               
                            {cell ? 
                                cell.length > 35 ? <abbr title={cell}> {cell} </abbr> : 
                                    columns[colIndex].type.dateTime ? 
                                        formatDate(cell, "DD/MM/YYYY") : 
                                            columns[colIndex].type.numeric || columns[colIndex].type.integer ? 
                                                cell.toLocaleString() : cell 
                                : ""}
                        </TableCell>
                    ))
                }
            </TableRow>
            {row[row.length - 1].length > 0 && open ? (
                <TableRow style={rowIndex % 2 ? {background: "#eeeded"} : {background: "white"}}>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={18}>  
                    {/* ClickAwayLister to close nested table if another row is clicked/opened */}
                    <ClickAwayListener onClickAway={handleClickAway}>
                        {/* Nested table of validations with InputForm component shown above table */}
                        <Collapse in={open} timeout="auto" unmountOnExit> 
                            <Box margin={0}>
                            <Typography variant="h6" gutterBottom component="div">
                                <InputForm 
                                    update={Main.update} 
                                    outcomeTypes={outcomeTypes} 
                                    nextActionTypes={nextActionTypes} 
                                    pathwayKey={row[0]} 
                                    rowData={rowData} 
                                    expandRow={setOpen} 
                                    rowOpen={open} 
                                    PathwayKeys={PathwayKeys}
                                    fieldNames={fieldNames}
                                    addValidationEndpoint={endpoints.addValidation}
                                />
                                <span style={{paddingLeft: "25px"}}>Validation Outcomes </span>
                            </Typography>
                            <Table aria-label="validations">
                                <TableHead>
                                <TableRow style={{height: 10}}>
                                    <TableCell style={{padding: "2px 8px", minWidth: "10px", height: "auto !important"}} colSpan={1}></TableCell>
                                    <TableCell style={{padding: "2px 8px", minWidth: "150px", height: "auto !important"}} colSpan={1}>Date</TableCell>
                                    <TableCell style={{padding: "2px 8px", minWidth: "150px", height: "auto !important"}} colSpan={1}>User</TableCell>
                                    <TableCell style={{padding: "2px 8px", minWidth: "150px", height: "auto !important"}} colSpan={1}>Outcome</TableCell>
                                    <TableCell style={{padding: "2px 8px", minWidth: "150px", height: "auto !important"}} colSpan={1}>Clock Start Date</TableCell>
                                    <TableCell style={{padding: "2px 8px", minWidth: "150px", height: "auto !important"}} colSpan={1}>Clock Stop Date</TableCell>
                                    <TableCell style={{padding: "2px 8px", minWidth: "150px", height: "auto !important"}} colSpan={1}>Next Action</TableCell>
                                    <TableCell style={{padding: "2px 8px", minWidth: "150px", height: "auto !important"}} colSpan={2}>Comment</TableCell>
                                    {row.slice(9, row.length).map(() => (
                                        <TableCell style={{padding: "2px 8px", height: "auto !important"}} colSpan={1}> </TableCell>
                                    ))}
                                </TableRow>
                                </TableHead>
                                <TableBody>
                                {row[row.length - 1].map((validationRow) => (
                                    <TableRow key={validationRow.date} style={{height:10}}>
                                        <TableCell component="th" scope="row" colSpan={1} style={{padding: "2px 8px", height: 'auto !important', width: "10px"}}>
                                            {// DeleteForm component only shown if user has entered the validation ie you can only delete your own validations
                                            rowData["User"].split("@")[0] === validationRow["OutcomeBy"] && 
                                                <DeleteForm 
                                                    update={Main.update} 
                                                    validationRow={validationRow} 
                                                    PathwayKeys={PathwayKeys} 
                                                    formatDate={formatDate} 
                                                    deleteValidationEndpoint={endpoints.deleteValidation}
                                                />
                                            }
                                        </TableCell>
                                        <TableCell component="th" scope="row" colSpan={1} style={{padding: "2px 8px", height: 'auto !important'}}>
                                            {formatDate(validationRow.OutcomeDate, "DD/MM/YYYY hh:mm:ss")}
                                        </TableCell>
                                        <TableCell colSpan={1} style={{padding: "2px 8px", height: 'auto !important', whiteSpace: "nowrap"}} >{validationRow.OutcomeBy}</TableCell>
                                        <TableCell colSpan={1} style={{padding: "2px 8px", height: 'auto !important', whiteSpace: "nowrap"}} >{validationRow.ValidationOutcomeType}</TableCell>
                                        <TableCell colSpan={1} style={{padding: "2px 8px", height: 'auto !important', whiteSpace: "nowrap"}} >
                                            {formatDate(validationRow.ClockStartDate, "DD/MM/YYYY")}
                                            </TableCell>
                                        <TableCell colSpan={1} style={{padding: "2px 8px", height: 'auto !important', whiteSpace: "nowrap"}} >
                                                {formatDate(validationRow.ClockStopDate, "DD/MM/YYYY")} 
                                            </TableCell>
                                        <TableCell colSpan={1} style={{padding: "2px 8px", height: 'auto !important', whiteSpace: "nowrap"}} >{validationRow.NextActionType}</TableCell>
                                        <TableCell colSpan={2} style={{padding: "2px 8px", height: 'auto !important', whiteSpace: "nowrap"}} >{validationRow.OutcomeComment}</TableCell>
                                        {row.slice(9, row.length).map(() => (
                                            <TableCell style={{padding: "2px 8px", height: "auto !important", width: "125px"}} colSpan={1}> </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            </Box>
                        </Collapse>
                        </ClickAwayListener>
                    </TableCell>
                </TableRow>)
            : null }
        </React.Fragment>
    );
  }


// Sorting functions
function descendingComparator<T>(a: T, b: T, orderBy: keyof T,columns) {
    
    const orderByIndex = columns.findIndex(col => col.displayName === orderBy);

    if (b[orderByIndex] < a[orderByIndex]) {
      return -1;
    }
    if (b[orderByIndex] > a[orderByIndex]) {
      return 1;
    }
    return 0;
  }
  
  type Order = 'asc' | 'desc';
  
  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key,
    columns
  ): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy, columns)
      : (a, b) => -descendingComparator(a, b, orderBy, columns);
  }
  
  function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  interface TableHeaderProps {
    classes: ReturnType<typeof useStyles>;
    onRequestSort: (event: React.MouseEvent<unknown>, property) => void;
    order: Order;
    orderBy: string;
    columns: any[];
    columnHeaders: any;
    fieldNames: any;
  }

  function VTableHeader(props: TableHeaderProps) {
    const { classes, order, orderBy, onRequestSort, columns, columnHeaders, fieldNames } = props;
    const createSortHandler = (property) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };
  
    return (
      <TableHead>
        <TableRow style={{height: 10}}>
            <TableCell style={{height: 'auto !important', width:"1%", backgroundColor: columnHeaders.backgroundColour}}/>
        
          {columns.filter(col => {
                // Hide these columns
                return [fieldNames.key, fieldNames.user, "ValidationStartDate", "ValidationEndDate"].indexOf(col.displayName) === -1 
            }).map((column) => (
            <TableCell
              key={column.displayName}
              sortDirection={orderBy === column.displayName ? order : false}
              style={{
                    backgroundColor: columnHeaders.backgroundColour,
                    height: 'auto !important', 
                    padding: "2px 8px", 
                }}
            >
              <TableSortLabel
                style={{
                    color: columnHeaders.fontColour,
                    fontFamily: columnHeaders.fontFamily,
                    fontSize: columnHeaders.fontSize,
                    fontWeight: "normal",
                }}
                classes={{icon: classes.sortIcon}}
                active={orderBy === column.displayName}
                direction={orderBy === column.displayName ? order : 'asc'}
                onClick={createSortHandler(column.displayName)}
              >
                {column.displayName}
                {orderBy === column.displayName ? (
                  <span className={classes.visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </span>
                ) : null}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

    );
  }
  
  function VTable(props) {
    const { rows, columns, columnHeaders, formatDate, nextActionTypes, outcomeTypes, PathwayKeys, fieldNames, endpoints } = props;
    const [order, setOrder] = React.useState<Order>('desc');
    const [orderBy, setOrderBy] = React.useState('Weeks');
    const classes = useStyles();
  
    const handleRequestSort = (event: React.MouseEvent<unknown>, property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    };


    return (
        <TableContainer component={Paper} style={{maxHeight: "100vh",overflow: "auto"}} >
            <Table aria-label="a dense table" stickyHeader={true}>
                <VTableHeader
                    classes={classes}
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                    columns={columns}
                    columnHeaders={columnHeaders}
                    fieldNames={fieldNames}
                />
                <TableBody>
                {stableSort(rows, getComparator(order, orderBy, columns)).map((row, rowIndex) => (
                    <Row 
                        key={row[0]} 
                        row={row} 
                        rowIndex={rowIndex} 
                        columns={columns}
                        formatDate={formatDate} 
                        outcomeTypes={outcomeTypes}
                        nextActionTypes={nextActionTypes}
                        PathwayKeys={PathwayKeys}
                        fieldNames={fieldNames}
                        endpoints={endpoints}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
  }
  
export class Main extends React.Component<{}, State>{

    constructor(props: any){
        super(props);
        this.state = initialState;
    }

    private static updateCallback: (data: object) => void = null;

    public static update(newState: State) {
        if(typeof Main.updateCallback === 'function'){
            Main.updateCallback(newState);
        }
    }

    public state: State = initialState;

    public componentWillMount() {
        Main.updateCallback = (newState: State): void => { this.setState(newState); };
    }

    public componentWillUnmount() {
        Main.updateCallback = null;
    }

    /**
     * Takes the row data from Power BI and joins the validation outcomes from the Azure Logic App.
     * These datasets join on the field Pathway_Key.
     * @returns array
     */
    public getRowsWithValidations() {
        return this.state.rows.map(row => ([
            ...row,
            this.state.validations.filter(validation => {return validation.Pathway_Key === row[0]}).sort((a, b) => {return a["IxOutcomeOrder"] - b["IxOutcomeOrder"]})
        ]))
    }

    /**
     * function to format cell value to correct type
     * @param value string -- cell value
     * @param type object -- type object from dataview component
     * @param format object -- desired format, different for different types
     */
    public formatDate(date: string, format: string) {
        if (!date) return null
        return moment(date).format(format)
    }

    render(){
        return (
            <div className="main">
                <VTable 
                    rows={this.getRowsWithValidations()} 
                    columns={this.state.columns}
                    columnHeaders={this.state.columnHeaders}
                    formatDate={this.formatDate} 
                    outcomeTypes={this.state.outcomeTypes}
                    nextActionTypes={this.state.nextActionTypes}
                    PathwayKeys={this.state.rows.map(row => row[0]).toString()}
                    fieldNames={this.state.fieldNames}
                    endpoints={this.state.endpoints}
                />
            </div>
        )
    }
}

export default Main;
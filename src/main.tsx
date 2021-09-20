import * as React from "react";
import * as moment from 'moment';
import axios from 'axios';

import { makeStyles, Theme, ThemeProvider, createStyles, withStyles } from '@material-ui/core/styles';

import {createMuiTheme
    ,Table 
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
    ,Grid
    ,IconButton
    ,Button
    ,TextField
    ,Dialog
    ,DialogActions
    ,DialogContent
    ,DialogTitle
    ,Typography
    ,InputLabel
    ,MenuItem
    ,FormControl
    ,Select
    // ,Switch
    ,CircularProgress
    ,Snackbar } from '@material-ui/core/';

import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import AddIcon from '@material-ui/icons/Add';
import SaveIcon from '@material-ui/icons/Save';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
// import CheckIcon from '@material-ui/icons/Check';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import { green, red } from "@material-ui/core/colors";
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';

export interface State {
    rows?: any[] | any,
    columns?: any[] | any,
    columnHeaders?: any | any,
    validations?: any[] | any,
    outcomeTypes?: any[] | any,
    nextActionTypes?: any[] | any,
    fieldNames?: any[] | any
}

export const initialState: State = {
    rows: [],
    columns: [],
    columnHeaders: {},
    validations: [],
    outcomeTypes: [],
    nextActionTypes: [],
    fieldNames: []
}
//NHS Blue "#005eb8"
//Dashboard template blue "#4cb6e6"
const nhsMaterialTheme = createMuiTheme({
    palette: {
        primary: {
            main: "#005eb8"
        },
        secondary: red
    }
})

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      margin: theme.spacing(1),
      minWidth: 500,
    },
    weeksGridTitle: {
        marginTop: "10px",
        marginLeft: "30px"
    },
    weeksGridNumber: {
        marginRight: "25px",
        fontSize: "1.6em"
    },
    infoGridLabel: {
        fontSize: "12px",
        color: "#8e8e8e"
    },
    infoGridContainer: {
        marginLeft: "10px"
    },
    
    submitButtonSuccess: {
        backgroundColor: green[500],
        '&:hover': {
          backgroundColor: green[700],
        },
    },submitButtonProgress: {
        color: green[500],
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12,
    },deleteButtonProgress: {
        color: red[500],
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12,
    },
    wrapper: {
        margin: theme.spacing(1),
        position: 'relative',
    },
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

function Alert(props: AlertProps) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function FormDialog(props) {
    const { outcomeTypes, nextActionTypes, pathwayKey, rowData, expandRow, rowOpen, PathwayKeys } = props;
    const [open, setOpen] = React.useState(false);
    const [outcomeType, setOutcomeType] = React.useState<Number | null>(0);
    const [nextActionType, setNextActionType] = React.useState<Number | null>();
    const [clockStartDate, setClockStartDate] = React.useState<Date | null>(rowData["Current_Clock_Start_Date"]);
    const [clockStopDate, setClockStopDate] = React.useState<Date | null>(rowData["Current_Clock_Stop_Date"]);
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [openToast, setOpenToast] = React.useState(false);
    const [toastSeverity, setToastSeverity] = React.useState('');
    const [toastMessage, setToastMessage] = React.useState('');
    const classes = useStyles();

    const handleChangeOutcomeType = (event: React.ChangeEvent<{ value: unknown }>) => {
        setOutcomeType(event.target.value as number);
        if (getOutcomeTypeById(event.target.value) === 'Added Clock Stop' ||
            getOutcomeTypeById(event.target.value) === 'Clock Already Stopped'
        ) {
            setClockStopDate(new Date) 
        }
    };

    const handleChangeNextActionType = (event: React.ChangeEvent<{ value: unknown }>) => {
        setNextActionType(event.target.value as number);
    };

    const handleClickOpen = () => {
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
        setClockStartDate(rowData["Current_Clock_Start_Date"])
        setClockStopDate(rowData["Current_Clock_Stop_Date"])
        setOutcomeType(null)
        setNextActionType(null)
    }

    const handleClockStartDateChange = (date: Date | null) => {
        setClockStartDate(date);
    };

    const handleClockStopDateChange = (date: Date | null) => {
        setClockStopDate(date);
    };

    const handleOpenToast = (severity: string, message: string) => {
        setOpenToast(true)
        setToastMessage(message)
        setToastSeverity(severity)
    }

    const handleCloseToast = (event?: React.SyntheticEvent, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenToast(false)
    };

    let outcomeTypeRef = React.createRef<HTMLInputElement>();
    let nextActionTypeRef = React.createRef<HTMLInputElement>();
    let commentRef = React.createRef<HTMLInputElement>();

    const clockStartDateChanged = () => clockStartDate.valueOf() !== rowData["Current_Clock_Start_Date"].valueOf()
    const clockStopDateChanged = () => {
        if (isNaN(clockStopDate.valueOf()) && isNaN(rowData["Current_Clock_Stop_Date"].valueOf()))
            return false
        else
            return clockStopDate.valueOf() !== rowData["Current_Clock_Stop_Date"].valueOf() 
    }
    
    const datesChanged = () => clockStartDateChanged() || clockStopDateChanged()

    const handleSubmit = () => {

        if (!loading) {
            setSuccess(false)
            setLoading(true)

            // axios.post('https://prod-03.uksouth.logic.azure.com:443/workflows/aa8fcea4df1a46ce939fc01559b5dee6/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=R385vl9UV9_nvdQ5yLc_B-_EFeZnyZIQ8Ou_XjREWhg',
            axios.post('https://prod-01.ukwest.logic.azure.com:443/workflows/7c0aee417934481db5ca9167cfe9e7b5/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ZPrz-T0KyTXFlUr0onZj8ktYjbvGaY9EV9Mdmi4amc0',
            {
                "PathwayID": pathwayKey,
                "ValidationOutcomeTypeID": outcomeTypeRef.current.value,
                "OutcomeBy": rowData["User"].split("@")[0],
                "OutcomeComment": commentRef.current.value,
                "OutcomeDate": null,
                "ClockStartDate": clockStartDateChanged() ? new Date(clockStartDate) : null,
                "ClockStopDate": clockStopDateChanged() ? new Date(clockStopDate) : null,
                "ValidationOutcomeCreatedBy": null,
                "ValidationOutcomeCreatedDate": null,
                "PathwayKeys": PathwayKeys,
                "NextActionTypeID": nextActionTypeRef.current.value
            }).then(response => {
                if (response.data["Table1"][0]["SuccessCode"] === 0) {
                    setSuccess(true)
                    window.setTimeout(() => {
                        handleOpenToast("success", response.data["Table1"][0]["SuccessString"])
                        setLoading(false)
                        Main.update({
                            validations: response.data["Table1"][0]["Pathway_Key"] ? response.data["Table1"] : []
                        })
                        if (!rowOpen) expandRow(true)
                        window.setTimeout(() => {
                            handleClose()
                        }, 3000)
                    }, 1000)
                } else {
                    setLoading(false)
                    Main.update({
                        validations: response.data["Table1"][0]["Pathway_Key"] ? response.data["Table1"] : []
                    })
                    handleOpenToast("error", response.data["Table1"][0]["SuccessCode"] + ': ' + response.data["Table1"][0]["SuccessString"])
                }
            }).catch(error => {
                setLoading(false)
                handleOpenToast("error", error.message)
            })
        }
    }

    const getOutcomeTypeById = (id) => {
        const outcomeType = outcomeTypes.filter(outcomeType => outcomeType.ValidationOutcomeTypeID === id)[0]
        if (outcomeType) {
            return outcomeType.ValidationOutcomeType
        } else {
            return ''
        }
    }

    return(
        <React.Fragment>
            <IconButton size="small" arial-label="add validation outcome" onClick={handleClickOpen}>
                <AddIcon/>
            </IconButton>
            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
            <DialogTitle style={{padding: "8px 24px"}} id="form-dialog-title">Record Validation Outcome</DialogTitle>
                    <DialogContent>
                        <Grid container direction="row" wrap="nowrap" justify="space-around" className={classes.infoGridContainer}>
                            <Grid container item direction="column" >
                                <Grid item className={classes.infoGridLabel}>Pathway ID</Grid>
                                <Grid item style={{userSelect: "text"}}>{rowData["PATHWAY_ID"]}</Grid>
                            </Grid>
                            <Grid container item direction="column" >
                                <Grid item className={classes.infoGridLabel}>Pas ID</Grid>
                                <Grid item style={{userSelect: "text"}}>{rowData["pas_id"]}</Grid>
                            </Grid>
                            <Grid container item direction="column" >
                                <Grid item className={classes.infoGridLabel}>NHS Number</Grid>
                                <Grid item style={{userSelect: "text"}}>{rowData["NHS_Number"]}</Grid>
                            </Grid>
                        </Grid>
                        <FormControl className={classes.formControl}>
                            <InputLabel id="outcomeType-select-label">Outcome Type</InputLabel>
                            <Select
                                labelId="outcomeType-select-label"
                                id="outcomeType-select"
                                value={outcomeType}
                                inputRef={outcomeTypeRef}
                                onChange={handleChangeOutcomeType}
                                MenuProps={{ disablePortal: true }}
                            >
                                {outcomeTypes.map(outcomeType => (
                                    <MenuItem value={outcomeType.ValidationOutcomeTypeID}>{outcomeType.ValidationOutcomeType}</MenuItem>    
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl className={classes.formControl}>
                            <InputLabel id="nextActionType-select-label">Next Action</InputLabel>
                            <Select
                                labelId="nextActionType-select-label"
                                id="nextActionType-select"
                                value={nextActionType}
                                inputRef={nextActionTypeRef}
                                onChange={handleChangeNextActionType}
                                MenuProps={{ disablePortal: true }}
                            >
                                {nextActionTypes.map(nextActionType => (
                                    <MenuItem value={nextActionType.NextActionTypeID}>{nextActionType.NextActionType}</MenuItem>    
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl className={classes.formControl}>
                            <TextField
                                autoFocus
                                margin="dense"
                                id="comment"
                                label="Comment"
                                type="comment"
                                inputRef={commentRef}
                                fullWidth
                            />
                                <Grid container direction="row" justify="space-between">
                                    <Grid container item xs={6} direction="column" justify="space-around">
                                        <ThemeProvider theme={nhsMaterialTheme}>
                                        <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                            <KeyboardDatePicker
                                                disableToolbar
                                                variant="inline"
                                                format="dd/MM/yyyy"
                                                margin="normal"
                                                id="clock-start-date"
                                                label="Clock Start Date"
                                                value={clockStartDate}
                                                onChange={handleClockStartDateChange}
                                                KeyboardButtonProps={{
                                                    'aria-label': 'change clock start date',
                                                }}
                                                maxDate={clockStopDate || rowData["SubmissionEndDate"]}
                                                maxDateMessage={"Clock Start Date can't be after " + (clockStopDate ? "Clock Stop Date." : "Census Date")}
                                                disabled={getOutcomeTypeById(outcomeType) !== 'Adjusted Weeks'}
                                            />
                                        </MuiPickersUtilsProvider>
                                        {
                                            clockStopDate || 
                                            getOutcomeTypeById(outcomeType) === 'Added Clock Stop' ||
                                            getOutcomeTypeById(outcomeType) === 'Clock Already Stopped'
                                            ?
                                            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                                <KeyboardDatePicker
                                                    disableToolbar
                                                    variant="inline"
                                                    format="dd/MM/yyyy"
                                                    margin="normal"
                                                    id="clock-stop-date"
                                                    label={(getOutcomeTypeById(outcomeType) === 'Removed Clock Stop' ? "Clock Stop Removed" : "Clock Stop Date")}
                                                    color={(getOutcomeTypeById(outcomeType) === 'Removed Clock Stop' ? "secondary" : "primary")}
                                                    value={clockStopDate}
                                                    onChange={handleClockStopDateChange}
                                                    KeyboardButtonProps={{
                                                        'aria-label': 'change clock stop date',
                                                    }}
                                                    readOnly={getOutcomeTypeById(outcomeType) === 'Removed Clock Stop'}
                                                    minDate={clockStartDate}
                                                    minDateMessage={"Clock Stop Date can't be before Clock Start Date"}
                                                    disabled={
                                                        getOutcomeTypeById(outcomeType) !== 'Added Clock Stop' &&
                                                        getOutcomeTypeById(outcomeType) !== 'Clock Already Stopped'
                                                    }
                                                />
                                            </MuiPickersUtilsProvider>
                                            :
                                            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                                <KeyboardDatePicker
                                                    disableToolbar
                                                    variant="inline"
                                                    format="dd/MM/yyyy"
                                                    margin="normal"
                                                    id="census-date"
                                                    label="Census Date"
                                                    value={rowData["SubmissionEndDate"]}
                                                    onChange={handleClockStopDateChange}
                                                    disabled
                                                />
                                            </MuiPickersUtilsProvider>
                                        }
                                        </ThemeProvider>
                                    </Grid>
                                    <Grid container item xs={6} direction="column" justify="space-around">
                                        <Grid container item direction="row" justify="space-between">
                                            <Grid item className={classes.weeksGridTitle}>Current Weeks Wait</Grid>
                                            <Grid item className={classes.weeksGridNumber}>
                                                {Math.floor(Math.ceil(Math.abs((rowData["SubmissionGroup"] === "Incomplete" ? 
                                                    rowData["SubmissionEndDate"].valueOf() : rowData["Current_Clock_Stop_Date"].valueOf()) 
                                                    - rowData["Current_Clock_Start_Date"].valueOf()) / (1000 * 60 * 60 * 24)) / 7)}</Grid>
                                        </Grid>
                                        <Grid container item direction="row" justify="space-between">
                                        {
                                            datesChanged() ?
                                            <React.Fragment>
                                                <Grid item className={classes.weeksGridTitle}>New Weeks Wait</Grid>
                                                <Grid item className={classes.weeksGridNumber}>
                                                    {Math.floor(Math.ceil(Math.abs((rowData["SubmissionGroup"] === "Incomplete" && outcomeType !== 2 ? 
                                                    rowData["SubmissionEndDate"].valueOf() : clockStopDate.valueOf()) 
                                                    - clockStartDate.valueOf()) / (1000 * 60 * 60 * 24)) / 7)}</Grid>
                                            </React.Fragment>
                                            : 
                                            <Grid item></Grid>
                                        }
                                        </Grid>
                                    </Grid>
                                </Grid>
                            {/* } */}
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <ThemeProvider theme={nhsMaterialTheme}>
                            <Button onClick={handleClose} variant="contained">
                                Cancel
                            </Button>
                            <div className={classes.wrapper}>
                                <Button 
                                    onClick={handleSubmit} 
                                    color="primary" 
                                    className={(success && classes.submitButtonSuccess)} 
                                    disabled={loading}
                                    variant="contained" 
                                    type="submit" 
                                    startIcon={<SaveIcon/>}
                                >
                                    Save
                                </Button>
                                {loading && <CircularProgress size={24} className={classes.submitButtonProgress} />}
                            </div>
                        </ThemeProvider>
                    </DialogActions>
                    {toastSeverity === "success" ?
                        <Snackbar open={openToast} autoHideDuration={2500} onClose={handleCloseToast}>
                            <Alert onClose={handleCloseToast} severity="success">
                                {toastMessage}
                            </Alert>
                        </Snackbar>
                        :
                        <Snackbar open={openToast} onClose={handleCloseToast}>
                            <Alert onClose={handleCloseToast} severity="error">
                                {toastMessage}
                            </Alert>
                        </Snackbar>
                    }
            </Dialog>
        </React.Fragment>
    )
}

function FormDelete(props) {
    const { validationRow, PathwayKeys, formatDate } = props;
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [openToast, setOpenToast] = React.useState(false);
    const [toastSeverity, setToastSeverity] = React.useState('');
    const [toastMessage, setToastMessage] = React.useState('');
    const classes = useStyles();

    const handleClickOpen = () => {
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
    }

    const handleOpenToast = (severity: string, message: string) => {
        setOpenToast(true)
        setToastMessage(message)
        setToastSeverity(severity)
    }

    const handleCloseToast = (event?: React.SyntheticEvent, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenToast(false)
    };

    const handleDelete = () => {
        setLoading(true)
        // axios.post('https://prod-31.uksouth.logic.azure.com:443/workflows/ade191d6d452440fb6b41d687f8f9ea2/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=upvRkk4EohJFm7g2NMaRYvnUqKabmDMsKz2-lQQXUFU',
        axios.post('https://prod-00.ukwest.logic.azure.com:443/workflows/83c7e679e0504320860dff4a49835d80/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BOQLsfnNXm--l72s-3hZOr_JzBZ-F1OZ6tPLbQdl214',
        {
            "ValidationOutcomeID": validationRow["ValidationOutcomeID"],
            "User": validationRow["OutcomeBy"],
            "PathwayKeys": PathwayKeys
        }).then(response => {
            if (response.data["Table1"][0]["SuccessCode"] === 0) {
                handleOpenToast("success", response.data["Table1"][0]["SuccessString"])
                setLoading(false)
                Main.update({
                    validations: response.data["Table1"][0]["Pathway_Key"] ? response.data["Table1"] : []
                })
                window.setTimeout(() => {
                    handleClose()
                }, 3000)
            } else {
                handleOpenToast("error", response.data["Table1"][0]["SuccessCode"] + ': ' + response.data["Table1"][0]["SuccessString"])
                setLoading(false)
                window.setTimeout(() => {
                    handleClose()
                }, 3000)
            }
        }).catch(error => {
            handleOpenToast("error", error.message)
            setLoading(false)
            window.setTimeout(() => {
                handleClose()
            }, 3000)
        })
    }

    return (
        <React.Fragment>
            <IconButton size="small" onClick={handleClickOpen}>
                <DeleteForeverIcon/>
            </IconButton>
            <Dialog open={open} onClose={handleClose} aria-labelledby="form-delete-title">
                <DialogTitle style={{padding: "8px 24px"}} id="form-delete-title">Delete Validation Outcome</DialogTitle>
                    <DialogContent>
                        <Grid container direction="column" wrap="nowrap" justify="space-around" className={classes.infoGridContainer}>
                            <Grid container item direction="column" style={{paddingBottom: "10px"}}>
                                <Grid item className={classes.infoGridLabel}>Outcome Date</Grid>
                                <Grid item>{formatDate(validationRow["OutcomeDate"], "DD/MM/YYYY hh:mm:ss")}</Grid>
                            </Grid>
                            <Grid container item direction="column" style={{paddingBottom: "10px"}}>
                                <Grid item className={classes.infoGridLabel}>Outcome Comment</Grid>
                                <Grid item>{validationRow["OutcomeComment"]}</Grid>
                            </Grid>
                            <Grid container item direction="column" style={{paddingBottom: "10px"}}>
                                <Grid item className={classes.infoGridLabel}>Outcome</Grid>
                                <Grid item>{validationRow["ValidationOutcomeType"]}</Grid>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <ThemeProvider theme={nhsMaterialTheme}>
                            <Button onClick={handleClose} variant="contained">
                                Cancel
                            </Button>
                            <div className={classes.wrapper}>
                                <Button 
                                    onClick={handleDelete} 
                                    color="secondary" 
                                    variant="contained" 
                                    type="submit" 
                                    startIcon={<DeleteForeverIcon/>}
                                >
                                    Delete
                                </Button>
                                {loading && <CircularProgress size={24} className={classes.deleteButtonProgress} />}
                            </div>
                        </ThemeProvider>
                    </DialogActions>
                    {toastSeverity === "success" ?
                        <Snackbar open={openToast} autoHideDuration={2500} onClose={handleCloseToast}>
                            <Alert onClose={handleCloseToast} severity="success">
                                {toastMessage}
                            </Alert>
                        </Snackbar>
                        :
                        <Snackbar open={openToast} onClose={handleCloseToast}>
                            <Alert onClose={handleCloseToast} severity="error">
                                {toastMessage}
                            </Alert>
                        </Snackbar>
                    }
            </Dialog>
        </React.Fragment>
    )
}

function Row(props) {
    const { row, rowIndex, columns, formatDate, outcomeTypes, nextActionTypes, PathwayKeys, fieldNames } = props;
    const [open, setOpen] = React.useState(false);

    const handleClickAway = (e) => {
        setOpen(false);
        console.log(e)
    };

    const handleClick = () => {
        setOpen(!open)
    }

    let rowData = {}
    columns.map((column, colIndex) => rowData[column.displayName] = (column.type.dateTime ? Date.parse(row[colIndex]) : row[colIndex]))

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
                        <FormDialog outcomeTypes={outcomeTypes} nextActionTypes={nextActionTypes} pathwayKey={row[0]} rowData={rowData} expandRow={setOpen} rowOpen={open} PathwayKeys={PathwayKeys}/>
                    )
                    }
                </TableCell>
                {row.slice(0,row.length-1).map((cell, colIndex) => (
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
                    <ClickAwayListener onClickAway={handleClickAway}>
                        <Collapse in={open} timeout="auto" unmountOnExit> 
                            <Box margin={0}>
                            <Typography variant="h6" gutterBottom component="div">
                                <FormDialog 
                                    outcomeTypes={outcomeTypes} 
                                    nextActionTypes={nextActionTypes} 
                                    pathwayKey={row[0]} 
                                    rowData={rowData} 
                                    expandRow={setOpen} 
                                    rowOpen={open} 
                                    PathwayKeys={PathwayKeys}
                                    fieldNames={fieldNames}
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
                                            {rowData["User"].split("@")[0] === validationRow["OutcomeBy"] && 
                                                <FormDelete validationRow={validationRow} PathwayKeys={PathwayKeys} formatDate={formatDate}/>
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
    const { rows, columns, columnHeaders, formatDate, nextActionTypes, outcomeTypes, PathwayKeys, fieldNames } = props;
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

                />
            </div>
            // <div className="main">
            //     <TableContainer component={Paper} style={{maxHeight: "100vh",overflow: "auto"}} >
            //     <Table aria-label="a dense table" stickyHeader={true}>
            //         <TableHead>
            //             <TableRow style={{height: 10}}>
            //                 <TableCell style={{height: 'auto !important', width:"1%", backgroundColor: this.state.columnHeaders.backgroundColour}}/>
            //                 {this.state.columns.filter(col => {
            //                     return col.displayName !== this.state.fieldNames.key && col.displayName !== this.state.fieldNames.user
            //                 }).map(column => (
            //                     <TableCell style={{
            //                         color: this.state.columnHeaders.fontColour,
            //                         fontFamily: this.state.columnHeaders.fontFamily,
            //                         fontSize: this.state.columnHeaders.fontSize,
            //                         fontWeight: "normal",
            //                         backgroundColor: this.state.columnHeaders.backgroundColour,
            //                         height: 'auto !important', 
            //                         padding: "2px 8px", 
            //                     }}>
            //                         {column.displayName}
            //                     </TableCell>  
            //                 ))}
            //             </TableRow>
            //         </TableHead>
            //         <TableBody>
            //         {this.getRowsWithValidations().map((row, rowIndex) => (
            //             <Row 
            //                 key={row[0]} 
            //                 row={row} 
            //                 rowIndex={rowIndex} 
            //                 columns={this.state.columns} 
            //                 formatDate={this.formatDate} 
            //                 outcomeTypes={this.state.outcomeTypes}
            //                 nextActionTypes={this.state.nextActionTypes}
            //                 PathwayKeys={this.state.rows.map(row => row[0]).toString()}
            //                 fieldNames={this.state.fieldNames}
            //             />
            //         ))}
            //         </TableBody>
            //     </Table>
            //     </TableContainer>
            // </div>
        )
    }
}

export default Main;
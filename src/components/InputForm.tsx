import * as React from "react";
import axios from 'axios';

import { ThemeProvider, makeStyles, createStyles, Theme, createTheme } from '@material-ui/core/styles';

import {
    Grid
    ,IconButton
    ,Button
    ,TextField
    ,Dialog
    ,DialogActions
    ,DialogContent
    ,DialogTitle
    ,InputLabel
    ,MenuItem
    ,FormControl
    ,Select
    ,CircularProgress
} from '@material-ui/core/';

import AddIcon from '@material-ui/icons/Add';
import SaveIcon from '@material-ui/icons/Save';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import { green, red } from "@material-ui/core/colors";

import Toast from './Toast';

const nhsMaterialTheme = createTheme({
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
    },
    wrapper: {
        margin: theme.spacing(1),
        position: 'relative',
    }
  }),
);

function InputForm(props) {
    const { update, outcomeTypes, nextActionTypes, pathwayKey, rowData, expandRow, rowOpen, PathwayKeys, addValidationEndpoint } = props;
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

    let outcomeTypeRef = React.createRef<HTMLInputElement>();
    let nextActionTypeRef = React.createRef<HTMLInputElement>();
    let commentRef = React.createRef<HTMLInputElement>();

    /**
     * Helper functions to determine if user has entered a new clock start or stop date.
     */
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

            axios.post(addValidationEndpoint,
            {
                "PathwayID": pathwayKey,
                "ValidationOutcomeTypeID": outcomeTypeRef.current.value,
                "OutcomeBy": rowData["User"].split("@")[0], //Use email prefix before @
                "OutcomeComment": commentRef.current.value,
                "OutcomeDate": null, //handled in the database
                "ClockStartDate": clockStartDateChanged() ? new Date(clockStartDate) : null, //Only submit if dates have been changed
                "ClockStopDate": clockStopDateChanged() ? new Date(clockStopDate) : null, //Only submit if dates have been changed
                "ValidationOutcomeCreatedBy": null, //placeholder to handle override for OutcomeBy field (not implemented)
                "ValidationOutcomeCreatedDate": null, //placeholder to handle override for OutcomeDate field (not implemented)
                "PathwayKeys": PathwayKeys,
                "NextActionTypeID": nextActionTypeRef.current.value
            }).then(response => {
                /**
                 * Response is normally instant, so loading state gauranteed to be at least 1 second for user experience
                 * Then toast message displayed for 3 seconds until modal auto closed
                 */
                if (response.data["Table1"][0]["SuccessCode"] === 0) {
                    setSuccess(true)
                    window.setTimeout(() => {
                        handleOpenToast("success", response.data["Table1"][0]["SuccessString"])
                        setLoading(false)
                        //Refresh validations data returned from database
                        update({
                            validations: response.data["Table1"][0]["Pathway_Key"] ? response.data["Table1"] : []
                        })
                        if (!rowOpen) expandRow(true)
                        window.setTimeout(() => {
                            handleClose()
                        }, 3000)
                    }, 1000)
                } else {
                    setLoading(false)
                    //Refresh validations data returned from database
                    update({
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

    // Helper function to handle business logic using outcome type labels rather than IDs
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
                                MenuProps={{ disablePortal: true }} //Without this the modal gets closed when selecting a dropdown value
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
                                MenuProps={{ disablePortal: true }} //Without this the modal gets closed when selecting a dropdown value
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
                                        /**
                                         * If a clock stop record or clock stop been added through validation,
                                         * show clock stop date picker
                                         */
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
                                                } //Only enable input if clock stop has been changed
                                            />
                                        </MuiPickersUtilsProvider>
                                        :
                                        /**
                                         * If incomplete record then show read only and disabled census date picker
                                         */
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
                                {/* Show the current weeks waited */}
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
                                        //If dates have been changed, show the updated weeks waited as comparison to current weeks waited
                                        datesChanged() ?
                                        <React.Fragment>
                                            <Grid item className={classes.weeksGridTitle}>New Weeks Wait</Grid>
                                            <Grid item className={classes.weeksGridNumber}>
                                                {Math.floor(Math.ceil(Math.abs((rowData["SubmissionGroup"] === "Incomplete" && outcomeType !== 2 ? 
                                                rowData["SubmissionEndDate"].valueOf() : clockStopDate.valueOf()) 
                                                - clockStartDate.valueOf()) / (1000 * 60 * 60 * 24)) / 7)}</Grid>
                                        </React.Fragment>
                                        : 
                                        //Empty element to keep flexbox happy
                                        <Grid item></Grid>
                                    }
                                    </Grid>
                                </Grid>
                            </Grid>
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
                    <Toast severity={toastSeverity} message={toastMessage} open={openToast} />
            </Dialog>
        </React.Fragment>
    )
}

export default InputForm;
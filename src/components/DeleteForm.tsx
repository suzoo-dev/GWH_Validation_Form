import * as React from "react";
import axios from 'axios';

import { makeStyles, Theme, ThemeProvider, createStyles, createTheme } from '@material-ui/core/styles';

import {
    Grid
    ,IconButton
    ,Button
    ,Dialog
    ,DialogActions
    ,DialogContent
    ,DialogTitle
    ,CircularProgress
} from '@material-ui/core/';

import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import 'date-fns';
import { green, red } from "@material-ui/core/colors";

import Toast from './Toast';

//NHS Blue "#005eb8"
//Dashboard template blue "#4cb6e6"
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
    infoGridLabel: {
        fontSize: "12px",
        color: "#8e8e8e"
    },
    infoGridContainer: {
        marginLeft: "10px"
    },
    deleteButtonProgress: {
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
    }
  }),
);

function DeleteForm(props) {
    const { update, validationRow, PathwayKeys, formatDate, deleteValidationEndpoint } = props;
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

    const handleDelete = () => {
        setLoading(true)
        axios.post(deleteValidationEndpoint,
        {
            "ValidationOutcomeID": validationRow["ValidationOutcomeID"],
            "User": validationRow["OutcomeBy"],
            "PathwayKeys": PathwayKeys
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
                    window.setTimeout(() => {
                        handleClose()
                    }, 3000)
                }, 1000)
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
                    <Toast severity={toastSeverity} message={toastMessage} open={openToast} />
            </Dialog>
        </React.Fragment>
    )
}

export default DeleteForm;
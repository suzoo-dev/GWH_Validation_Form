import * as React from "react";
import { useEffect } from "react";
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import { Snackbar } from '@material-ui/core/';

function Alert(props: AlertProps) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function Toast(props) {
    const { severity, message, open } = props;
    const [openToast, setOpenToast] = React.useState(open);

    useEffect(() => { 
        setOpenToast(open) 
    }, [open]);

    const handleCloseToast = (event?: React.SyntheticEvent, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenToast(false)
    };

    return (
        <Snackbar open={openToast} autoHideDuration={severity === "success" ? 2500 : null} onClose={handleCloseToast}>
            <Alert onClose={handleCloseToast} severity={severity}>
                {message}
            </Alert>
        </Snackbar>
    )
}

export default Toast;
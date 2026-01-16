import { get } from 'lodash';
import { createTheme } from '@mui/material/styles';
// import { makeStyles } from '@material-ui/styles';


Theming = {
  createTheme(reference){

        // This is necessary for the Material UI component render layer
    let theme = {
        primaryColor: "rgb(177, 128, 13)",
        primaryText: "rgba(255, 255, 255, 1) !important",

        secondaryColor: "rgb(177, 128, 13)",
        secondaryText: "rgba(255, 255, 255, 1) !important",

        cardColor: "rgba(255, 255, 255, 1) !important",
        cardTextColor: "rgba(0, 0, 0, 1) !important",

        errorColor: "rgb(128,20,60) !important",
        errorText: "#ffffff !important",

        appBarColor: "#f5f5f5 !important",
        appBarTextColor: "rgba(0, 0, 0, 1) !important",

        paperColor: "#f5f5f5 !important",
        paperTextColor: "rgba(0, 0, 0, 1) !important",

        backgroundCanvas: "rgba(255, 255, 255, 1) !important",
        background: "linear-gradient(45deg, rgb(177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

        nivoTheme: "greens"
    }

    // if we have a globally defined theme from a settings file
    if(get(Meteor, 'settings.public.theme.palette')){
        theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
    }

    const muiTheme = createTheme({
        typography: {
            useNextVariants: true,
        },
        palette: {
            primary: {
                main: theme.primaryColor,
                contrastText: theme.primaryText
            },
            secondary: {
                main: theme.secondaryColor,
                contrastText: theme.errorText
            },
            appBar: {
                main: theme.appBarColor,
                contrastText: theme.appBarTextColor
            },
            cards: {
                main: theme.cardColor,
                contrastText: theme.cardTextColor
            },
            paper: {
                main: theme.paperColor,
                contrastText: theme.paperTextColor
            },
            error: {
                main: theme.errorColor,
                contrastText: theme.secondaryText
            },
                background: {
                default: theme.backgroundCanvas
            },
            contrastThreshold: 3,
            tonalOffset: 0.2
        }
    });
    
    return muiTheme;
  },
  useStyles(){
    // const useStyles = makeStyles(theme => ({
    //     button: {
    //       background: theme.background,
    //       border: 0,
    //       borderRadius: 3,
    //       boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    //       color: theme.buttonText,
    //       height: 48,
    //       padding: '0 30px',
    //     },
    //     hideOnPhone: {
    //       visibility: 'visible',
    //       hide: 'table'
    //     },
    //     cellHideOnPhone: {
    //       visibility: 'visible',
    //       hide: 'table',
    //       paddingTop: '16px',
    //       maxWidth: '120px'
    //     },
    //     cell: {
    //       paddingTop: '16px'
    //     }
    //   }));
    //   return useStyles;
  }
}

export default Theming;
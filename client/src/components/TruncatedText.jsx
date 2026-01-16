import { Tooltip, Typography } from '@mui/material';

/**
 * A component that truncates long text and shows the full text in a tooltip on hover.
 */
const TruncatedText = ({ text, variant = "body1", sx = {}, maxWidth = '100%' }) => {
    return (
        <Tooltip title={text} arrow placement="top">
            <Typography
                variant={variant}
                noWrap
                sx={{
                    maxWidth: maxWidth,
                    cursor: 'default',
                    ...sx
                }}
            >
                {text}
            </Typography>
        </Tooltip>
    );
};

export default TruncatedText;

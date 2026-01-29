import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { Language as LanguageIcon, Check as CheckIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
    const { i18n, t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
        handleClose();
    };

    const currentLanguage = i18n.language || 'en';

    return (
        <>
            <Tooltip title={t('language.selectLanguage')}>
                <IconButton
                    onClick={handleClick}
                    size="small"
                    sx={{
                        color: 'inherit',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)'
                        }
                    }}
                >
                    <LanguageIcon />
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        minWidth: 180,
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }
                }}
            >
                <MenuItem
                    onClick={() => handleLanguageChange('en')}
                    selected={currentLanguage === 'en'}
                >
                    <ListItemIcon>
                        {currentLanguage === 'en' && <CheckIcon fontSize="small" color="primary" />}
                    </ListItemIcon>
                    <ListItemText>
                        English
                    </ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => handleLanguageChange('am')}
                    selected={currentLanguage === 'am'}
                >
                    <ListItemIcon>
                        {currentLanguage === 'am' && <CheckIcon fontSize="small" color="primary" />}
                    </ListItemIcon>
                    <ListItemText sx={{ fontFamily: "'Noto Sans Ethiopic', 'Nyala', sans-serif" }}>
                        አማርኛ
                    </ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default LanguageSelector;

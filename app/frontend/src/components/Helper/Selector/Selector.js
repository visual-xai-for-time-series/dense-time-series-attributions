import React, { useState } from 'react';

import FormControl from '@mui/material/FormControl';

import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';

export function Selector({ input, output }) {
    const id = input.id;
    const id_label = id + '-label';

    const label = input.name;
    const name = input.name.toLowerCase().replace(/\s/g, '_');

    const available_options = input.available_options;

    const default_value = input.value !== '' ? input.value : available_options[0];
    const [value, setValue] = useState(default_value);

    const handleSelect = (event) => {
        setValue(event.target.value);
        output(event);
    };

    return (
        <FormControl
            sx={{
                m: 1,
                display: 'flex',
                wrap: 'nowrap',
                fullWidth: true,
            }}
            size="small"
        >
            <InputLabel id={id_label}>{label}</InputLabel>
            <Select
                autoWidth={true}
                labelId={id_label}
                id={id}
                value={value}
                label={label}
                onChange={handleSelect}
                name={name}
            >
                {available_options.length > 0
                    ? available_options.map((name) => (
                          <MenuItem key={name} value={name}>
                              {name}
                          </MenuItem>
                      ))
                    : null}
            </Select>
        </FormControl>
    );
}


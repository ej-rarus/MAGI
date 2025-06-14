import React from 'react';

interface ConnectProps {
    x1: number | string;
    y1: number | string;
    x2: number | string;
    y2: number | string;
}

const Connect: React.FC<ConnectProps> = ({ x1, y1, x2, y2 }) => {
    return (

        <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--theme-color)"
            strokeWidth="25"
        />
    );
};

export default Connect;
"use client";

import { useState, useEffect } from "react";

export default function TestPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching from: http://localhost:8359/api/v1/projects');
                const response = await fetch('http://localhost:8359/api/v1/projects');
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                console.log('Data received:', result);
                setData(result);
            } catch (err: any) {
                console.error('Fetch error:', err);
                setError(err?.message || String(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Test API Data</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}

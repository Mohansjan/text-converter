import React, { useState, useEffect } from "react";

const ExampleSection = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);

    const fetchData = async () => {
        const apiUrl = 'https://dev-mohansjan.gateway.apiplatform.io/v1/FinalScores';
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'pkey': '3fcc20cdc093c0403fc55b721aab6f3c',
                    'apikey': 'QLRDtcDdccCNiGnYHIQfmqUbfhQm86ot',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            const result = await response.json();
            console.log("API Result:", result);  // Check this output to understand the structure
            
            // Example: If the data is inside a "scores" property
            setData(result.scores || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="example">
            <div className="title">
                <h2 className="title-1">Final Scores</h2>
            </div>
            <div className="bodySec">
                <table className="bodySec-1">
                    <thead>
                        <tr>
                            <th>Final Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.finalScore}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td>No data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExampleSection;

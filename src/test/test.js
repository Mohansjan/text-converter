import React, { useState, useEffect } from 'react';
import './test.css';

const Test = () => {
    const [test, setTest] = useState([]);
    const [creator, setCreator] = useState([]); // Initialize as empty array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const creatorData = async () => {
        const API_URL = "https://dev-mohansjan.gateway.apiplatform.io/v1/creator";
        try {
            const res = await fetch(API_URL, {
                method: "GET",
                headers: {
                    'pkey': '3fcc20cdc093c0403fc55b721aab6f3c',
                    'apikey': 'QLRDtcDdccCNiGnYHIQfmqUbfhQm86ot',
                    'Content-Type': 'application/json'
                },
            });

            if (!res.ok) {
                throw new Error(`Network response was not ok: ${res.statusText}`);
            }

            const data2 = await res.json();
            console.log("Creator Data:", data2); // Log the creator data
            
            // Ensure you're getting an array or wrap in array
            setCreator(Array.isArray(data2) ? data2 : [data2]);
        } catch (error) {
            setError(error.message);
        }
    };
    
    const fetchData = async () => {
        const apiUrl = 'https://dev-mohansjan.gateway.apiplatform.io/v1/ImageSection';
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

            const data = await response.json();
            console.log("Image Data:", data); // Log the image data

            if (Array.isArray(data)) {
                setTest(data);
            } else if (data.Image && Array.isArray(data.Image)) {
                setTest(data.Image);
            } else {
                throw new Error('Unexpected data structure');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        creatorData(); // Fetch creator data
        fetchData();   // Fetch image data
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div className="image-container">
            {/* Display Image Section */}
            {test.length > 0 ? (
                test.map((image, index) => (
                    <div key={index} className="image-card">
                        <h3 className="image-name">{image.image_name || 'No Name Available'}</h3>
                        <img src={image.image_url} alt={image.image_name || 'Image'} className="image" />
                    </div>
                ))
            ) : (
                <p>No image data available</p>
            )}
            
            {/* Display Creator Data in a Table */}
            {creator.length > 0 && (
                <div>
                    <h2>Creator Data</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Product Discount</th>
                                <th>Product Price</th>
                                <th>EMI Option</th>
                                <th>Delivery Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {creator.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.Product_Name}</td>
                                    <td>{item.Product_Discount}</td>
                                    <td>{item.Product_Price}</td>
                                    <td>{item.EMI_Option}</td>
                                    <td>{item.Delivary_date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Test;

import React, { useState, useEffect } from 'react';
import './tables.css';

const Tables = () => {
    const [students, setStudents] = useState([]);
    const fetchData = async () => {
        const apiUrl = 'https://dev-mohansjan.gateway.apiplatform.io/v1/Students';
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
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // const handleViewMarks = (studentId) => {
    //     alert(`View marks for student ID: ${studentId}`);
    // };

    return (
        <div className="container">
            <div className="header">
                <div className="head">
                    <h6>JEE Students MarkList</h6>
                </div>
            </div>
            <table className="table table-dark table-bordered mb-0">
                <thead>
                    <tr>
                        <th scope="col">Student_Id</th>
                        <th scope="col">First_Name</th>
                        <th scope="col">Last_Name</th>
                        <th scope="col">Omr_Number</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student) => (
                        <tr key={student.student_id}>
                            <td>{student.student_id}</td>
                            <td>{student.first_name}</td>
                            <td>{student.last_name}</td>
                            <td>{student.omr_number}</td>
                            <td>{student.phone}</td>
                            <td>
                               <a href='/marks'> <button
                                    className="view-marks-btn"
                                    // onClick={() => handleViewMarks(student.student_id)}
                                >
                                    View Marks
                                </button></a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Tables;

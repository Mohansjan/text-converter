import React, { useState, useEffect } from 'react';
import './marks.css';

const Tables = () => {
    const [studentDetails, setStudentDetails] = useState([]);
    const [finalScores, setFinalScores] = useState([]);  
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudentDetails = async () => {
            const apiUrl = 'https://dev-mohansjan.gateway.apiplatform.io/v1/StudentDetails';
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
                setStudentDetails(data);
            } catch (error) {
                setError(error.message);
            }
        };

        const fetchFinalScores = async () => {
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
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                console.log('Final Scores:', result); // Log the response to inspect the structure

                // Validate if the response is an array and matches expected structure
                if (Array.isArray(result)) {
                    const validFinalScores = result.filter(score => 
                        typeof score.subject_id === 'number' &&
                        typeof score.student_id === 'number' &&
                        typeof score.right_score === 'number' &&
                        typeof score.wrong_score === 'number' &&
                        typeof score.left_score === 'number'
                    );
                    console.log(validFinalScores);

                    setFinalScores(validFinalScores);
                } else {
                    setFinalScores([]);
                }
            } catch (error) {
                setError(error.message);
            }
        };

        fetchStudentDetails();
        fetchFinalScores();
    }, []);

    const calculateTotalMarks = (right_Score, wrong_Score, left_Score) => {
        return (right_Score * 4) + (wrong_Score * -1) + (left_Score * 0);
    };

    const studentsWithMarks = studentDetails.map((student) => ({
        ...student,
        totalMarks: calculateTotalMarks(student.right_score, student.wrong_score, student.left_score),
        finalScore: finalScores.find(score => score.student_id === student.student_id)?.final_score || 'N/A'
    }));

    const sortedById = [...studentsWithMarks].sort((a, b) => a.student_id - b.student_id);

    if (error) {
        return <p>Error: {error}</p>;
    }

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
                        <th scope="col">Student ID</th>
                        <th scope="col">First Name</th>
                        <th scope="col">Last Name</th>
                        <th scope="col">OMR Number</th>
                        <th scope="col">Right Score</th>
                        <th scope="col">Wrong Score</th>
                        <th scope="col">Left Score</th>
                        <th scope="col">Total Score</th>
                        <th scope="col">Final Score</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedById.map((student) => (
                        <tr key={student.student_id}>
                            <td>{student.student_id}</td>
                            <td>{student.first_name}</td>
                            <td>{student.last_name}</td>
                            <td>{student.omr_number}</td>
                            <td>{student.right_score}</td>
                            <td>{student.wrong_score}</td>
                            <td>{student.left_score}</td>
                            <td>{student.totalMarks}</td>
                            <td>{student.finalScore}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <table className="table table-dark table-bordered mb-0">
                <thead>
                    <tr>
                        <th scope="col">Subject ID</th>
                        <th scope="col">Student ID</th>
                        <th scope="col">Right Score</th>
                        <th scope="col">Wrong Score</th>
                        <th scope="col">Left Score</th>
                    </tr>
                </thead>
                <tbody>
                    {finalScores.map((score) => (
                        <tr key={score.student_id}>
                            <td>{score.subject_id}</td>
                            <td>{score.student_id}</td>
                            <td>{score.right_score}</td>
                            <td>{score.wrong_score}</td>
                            <td>{score.left_score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Tables;

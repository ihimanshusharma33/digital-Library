import React, { useState, useEffect } from 'react';
import {
    Search,
    Edit,
    ChevronDown,
    ChevronUp,
    Loader,
    UserX,
    AlertCircle,
    CheckCircle,
    Download,
    Trash2  // Add this import
} from 'lucide-react';
import { api } from '../../utils/apiService';
import { ApiResponse, Student } from '../../types';

interface EditableStudentFields {
    name: string;
    email: string;
    phone_number: string;
    department: string;
    university_roll_number: string;
    course_name: string;
    course_id: number;
    library_id?: number | string;
}

const StudentManager: React.FC = () => {
    // State for students data
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State for search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState<string | undefined>(undefined);
    const [filterCourse, setFilterCourse] = useState<string | undefined>(undefined);
    const [filterStatus, setFilterStatus] = useState<boolean | undefined>(undefined);

    // State for sorting
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Student;
        direction: 'ascending' | 'descending';
    }>({ key: 'name', direction: 'ascending' });

    // State for editing
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState<EditableStudentFields>({
        name: '',
        email: '',
        phone_number: '',
        department: '',
        university_roll_number: '',
        course_id: 0,
        course_name: '',
        'library_id': 0
    });

    // State for operation feedback
    const [notification, setNotification] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    // State for processing students
    const [processingStudentId, setProcessingStudentId] = useState<number | null>(null);

    // Departments and courses extracted from student data
    const [departments, setDepartments] = useState<string[]>([]);
    const [courses, setCourses] = useState<string[]>([]);

    // Add a new state for delete confirmation modal
    const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);

    // Fetch students on component mount
    useEffect(() => {
        fetchStudents();
    }, []);

    // Extract unique departments and courses from student data
    useEffect(() => {
        if (students.length > 0) {

            const uniqueDepartments = [
                ...new Set(students.map(student =>
                    student.department || '').filter(dep => dep !== ''))
            ];

            const uniqueCourses = [...new Set(students.map(student =>
                student.course_code).filter(code => code !== ''))];

            setDepartments(uniqueDepartments);
            setCourses(uniqueCourses);
        }
    }, [students]);

    // Apply filters and search
    useEffect(() => {
        let result = [...students];

        // Apply search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(student =>
                student.name.toLowerCase().includes(searchLower) ||
                student.email.toLowerCase().includes(searchLower) ||
                (student.library_id ? student.library_id.toString().toLowerCase().includes(searchLower) : false) ||
                (student.university_roll_number ? student.university_roll_number.toString().toLowerCase().includes(searchLower) : false) ||
                (student.phone_number && student.phone_number.toString().toLowerCase().includes(searchLower))
            );
        }

        // Apply department filter
        if (filterDepartment) {
            result = result.filter(student => student.department === filterDepartment);
        }

        // Apply course filter
        if (filterCourse) {
            result = result.filter(student => student.course_code === filterCourse);
        }



        // Apply sorting
        result.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === bValue) return 0;

            const comparison = (aValue ?? '').toString() < (bValue ?? '').toString() ? -1 : 1;
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });

        setFilteredStudents(result);
    }, [students, searchTerm, filterDepartment, filterCourse, filterStatus, sortConfig]);

    const fetchStudents = async () => {
        try {
            setIsLoading(true);
            const response = await api.get<ApiResponse>('/user');
            console.log('API response:', response);

            if (response && response.status) {
                // Extract students from the response structure: {status, message, data}
                setStudents(Array.isArray(response.data) ? response.data : []);
                console.log('Students set:', response.data);
            } else {
                console.error('Failed to fetch students:', response?.message);
                setNotification({
                    type: 'error',
                    message: 'Failed to load students. Please try again later.'
                });
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            setNotification({
                type: 'error',
                message: 'An error occurred while loading students.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (key: keyof Student) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleEditClick = (student: Student) => {
        setEditingStudent(student);
        setFormData({
            name: student.name,
            email: student.email,
            phone_number: student.phone_number || '',
            department: student.department || '',
            university_roll_number: student.university_roll_number.toString(),
            course_id: Number(student.course_id) || 0, // Ensure course_id is a number
            course_name: student.course_name || '', // Provide default value
            library_id: student.library_id || 0 // Provide default value
        });
    };

    const handleCancelEdit = () => {
        setEditingStudent(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData({
                ...formData,
                [name]: target.checked
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;

        try {
            setProcessingStudentId(Number(editingStudent.user_id));

            const response = await api.put<ApiResponse>(`/user/${editingStudent.user_id}`, formData);

            if (response && response.status) {
                setEditingStudent(null);
                setNotification({
                    type: 'success',
                    message: 'Student information updated successfully.'
                });
            } else {
                throw new Error(response?.message || 'Failed to update student information.');
            }
        } catch (error) {
            console.error('Error updating student:', error);
            setNotification({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to update student. Please try again.'
            });
        } finally {
            setProcessingStudentId(null);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const exportToCSV = () => {
        // Create CSV headers
        let csv = 'Library ID,Name,Email,University Roll No,Department,Course Code,Phone,Status,Created Date\n';

        // Add each student as a row
        filteredStudents.forEach(student => {
            csv += `${student.library_id},`;
            csv += `"${student.name}",`;
            csv += `${student.email},`;
            csv += `${student.university_roll_number},`;
            csv += `"${student.department || ''}",`;
            csv += `${student.course_code},`;
            csv += `${student.phone_number || ''},\n`;
        });

        // Create a download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `students-export-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    // Add the handleDeleteClick function
    const handleDeleteClick = (student: Student) => {
        setDeleteConfirmStudent(student);
    };

    // Add the handleDeleteConfirm function
    const handleDeleteConfirm = async () => {
        if (!deleteConfirmStudent) return;

        try {
            setProcessingStudentId(Number(deleteConfirmStudent.user_id));

            const response = await api.delete<ApiResponse>(`/user/${deleteConfirmStudent.user_id}`);

            if (response && response.status) {
                // Remove the student from the local state
                const updatedStudents = students.filter(student =>
                    student.user_id !== deleteConfirmStudent.user_id
                );

                setStudents(updatedStudents);
                setDeleteConfirmStudent(null);

                setNotification({
                    type: 'success',
                    message: 'Student has been deleted successfully.'
                });
            } else {
                throw new Error(response?.message || 'Failed to delete student.');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            setNotification({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to delete student. Please try again.'
            });
        } finally {
            setProcessingStudentId(null);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    // Add the handleCancelDelete function
    const handleCancelDelete = () => {
        setDeleteConfirmStudent(null);
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Notification Banner */}
            {notification && (
                <div className={`mb-6 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {notification.type === 'success' ? (
                                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                            )}
                            <div className={`ml-1 text-sm font-medium ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                {notification.message}
                            </div>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <span className="sr-only">Dismiss</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                    <p className="text-gray-600">View and manage student information, status, and account details.</p>
                </div>

                <button
                    onClick={exportToCSV}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export to CSV
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search students by name, email, ID..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/* Department filter */}
                        <div className="relative">
                            <select
                                value={filterDepartment || ''}
                                onChange={(e) => setFilterDepartment(e.target.value || undefined)}
                                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Departments</option>
                                {departments.map(department => (
                                    <option key={department} value={department}>
                                        {department}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Course filter */}
                        <div className="relative">
                            <select
                                value={filterCourse || ''}
                                onChange={(e) => setFilterCourse(e.target.value || undefined)}
                                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Courses</option>
                                {courses.map(course => (
                                    <option key={course} value={course}>
                                        {course}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading students...</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserX className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mt-4 text-gray-900 font-medium">No students found</h3>
                        <p className="mt-1 text-gray-500">
                            {searchTerm || filterDepartment || filterCourse || filterStatus !== undefined ?
                                'Try adjusting your search or filter criteria.' :
                                'There are no students registered in the system yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Student Info

                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('university_roll_number')}
                                    >
                                        <div className="flex items-center">
                                            Roll Number

                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('library_id')}
                                    >
                                        <div className="flex items-center">
                                            Library ID
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('course_name')}
                                    >
                                        <div className="flex items-center">
                                            Course

                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('department')}
                                    >
                                        <div className="flex items-center">
                                            Department

                                        </div>
                                    </th>

                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.map((student) => (
                                    <tr key={student.user_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    {student.profile_image ? (
                                                        <img
                                                            src={student.profile_image}
                                                            alt={student.name}
                                                            className="h-10 w-10 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <span className="font-medium text-gray-600">
                                                                {student.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                    <div className="text-sm text-gray-500">{student.email}</div>
                                                    <div className="text-xs text-gray-400">ID: {student.library_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.university_roll_number}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.library_id}</div>

                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.course_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.department || 'Not specified'}</div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {editingStudent?.user_id === student.user_id ? (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={handleSubmit}
                                                        className="text-green-600 hover:text-green-900"
                                                        disabled={processingStudentId === Number(student.user_id)}
                                                    >
                                                        {processingStudentId === Number(student.user_id) ? (
                                                            <Loader className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            'Save'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleEditClick(student)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        disabled={processingStudentId === Number(student.user_id)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(student)}
                                                        className="text-red-600 hover:text-red-900"
                                                        disabled={processingStudentId === Number(student.user_id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Editing Form Modal */}
            {editingStudent && (
                <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg max-w-lg w-full mx-4 shadow-xl">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h3 className="text-xl font-medium text-gray-900">
                                Edit Student Information
                            </h3>
                            <button
                                onClick={handleCancelEdit}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="text-xl">✕</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="university_roll_number" className="block text-sm font-medium text-gray-700">
                                            University Roll Number
                                        </label>
                                        <input
                                            type="number"
                                            name="university_roll_number"
                                            id="university_roll_number"
                                            value={formData.university_roll_number}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                            Library ID
                                        </label>
                                        <input
                                            name="library_id"
                                            id="library_id"
                                            readOnly
                                            value={formData.library_id}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />

                                    </div>

                                    <div>
                                        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            name="phone_number"
                                            id="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="course_code" className="block text-sm font-medium text-gray-700">
                                            Course Name
                                        </label>
                                        <input
                                            type="text"
                                            name="course_id"
                                            id="course_id"
                                            value={formData.course_name}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>


                                <div className="flex justify-end pt-5 space-x-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        onClick={handleCancelEdit}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        disabled={processingStudentId === Number(editingStudent.user_id)}
                                    >
                                        {processingStudentId === Number(editingStudent.user_id) ? (
                                            <>
                                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmStudent && (
                <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-xl font-medium text-gray-900">
                                Delete Student
                            </h3>
                        </div>

                        <div className="p-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-900">Delete {deleteConfirmStudent.name}</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Are you sure you want to delete this student? This action cannot be undone.
                                        All data associated with this student will be permanently removed.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-center space-x-3">
                                <button
                                    type="button"
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={handleCancelDelete}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    onClick={handleDeleteConfirm}
                                    disabled={processingStudentId === Number(deleteConfirmStudent.user_id)}
                                >
                                    {processingStudentId === Number(deleteConfirmStudent.user_id) ? (
                                        <>
                                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Delete"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManager;
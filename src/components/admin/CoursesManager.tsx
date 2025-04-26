// CoursesManager.tsx  (React 18+, Tailwind, lucide‑react)

/* __define-ocg__
   Fully functional courses CRUD with toasts + modal feedback.
   varOcg holds local state we tweak during requests.
*/

import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  Search,
  GraduationCap,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Course } from '../../types';
import { courses as mockCourses } from '../../utils/mockData';
import { API_ENDPOINTS } from '../../utils/apiService';

/* ---------- Toast ---------- */

interface ToastState {
  type: 'success' | 'error';
  message: string;
}
interface ToastProps extends ToastState {
  onClose: () => void;
}
const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      className={`fixed bottom-4 right-4 z-50 flex min-w-96 items-center rounded-lg p-4 shadow ${
        type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
      ) : (
        <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
      )}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        aria-label="Close"
        className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

/* ---------- Main manager ---------- */

const CoursesManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filtered, setFiltered] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [sort, setSort] = useState<{ key: keyof Course | null; dir: 'asc' | 'desc' }>({
    key: 'course_name',
    dir: 'asc',
  });
  const [toast, setToast] = useState<ToastState | null>(null);

  /* ---- fetch ---- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_ENDPOINTS.COURSES);
        const json = await res.json();
        if (json?.data && Array.isArray(json.data)) {
          const formatted = json.data.map((c: any) => ({
            ...c,
            name: c.course_name ?? c.name,
            code: c.course_code ?? c.code,
          }));
          setCourses(formatted);
          setFiltered(formatted);
        } else throw new Error('Invalid format');
      } catch (err) {
        console.error(err);
        setCourses(mockCourses);
        setFiltered(mockCourses);
        setToast({ type: 'error', message: 'Failed to load courses. Using sample data.' });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /* ---- search + sort ---- */
  useEffect(() => {
    let list = [...courses];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.course_name?.toLowerCase().includes(q) ||
          c.course_code?.toLowerCase().includes(q) ||
          c.department?.toLowerCase().includes(q) ||
          c.name?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q)
      );
    }
    if (sort.key) {
      list.sort((a, b) => {
        const av = (a[sort.key!] as any) ?? '';
        const bv = (b[sort.key!] as any) ?? '';
        if (av < bv) return sort.dir === 'asc' ? -1 : 1;
        if (av > bv) return sort.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFiltered(list);
  }, [courses, search, sort]);

  const reqSort = (key: keyof Course) =>
    setSort((s) => ({
      key,
      dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc',
    }));
  const icon = (k: keyof Course) =>
    sort.key !== k ? (
      <ChevronDown className="h-4 w-4 opacity-20" />
    ) : sort.dir === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );

  /* ---------- CRUD helpers ---------- */

  const saveCourse = async (
    data: Omit<Course, 'id'>
  ): Promise<{ ok: boolean; message: string }> => {
    try {
      if (editing) {
        const res = await fetch(`${API_ENDPOINTS.COURSES}/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const j = await res.json();
        if (j?.status) {
          setCourses((cs) =>
            cs.map((c) => (c.id === editing.id ? { ...c, ...data, updated_at: new Date().toISOString() } : c))
          );
          return { ok: true, message: 'Course updated successfully' };
        }
        return { ok: false, message: j.message ?? 'Failed to update course' };
      }
      const res = await fetch(API_ENDPOINTS.COURSES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json();
      if (j?.status) {
        const newC: Course = {
          id: j.data?.id ?? Date.now(),
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCourses((cs) => [...cs, newC]);
        return { ok: true, message: 'Course added successfully' };
      }
      return { ok: false, message: j.message ?? 'Failed to add course' };
    } catch (err) {
      console.error(err);
      return {
        ok: false,
        message: `Error ${editing ? 'updating' : 'adding'} course. Please try again.`,
      };
    }
  };

  const delCourse = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.COURSES}/${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (j?.status) {
        setCourses((cs) => cs.filter((c) => c.id !== id));
        setToast({ type: 'success', message: 'Course deleted successfully' });
      } else setToast({ type: 'error', message: j.message ?? 'Failed to delete course' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Error deleting course' });
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- render ---------- */

  return (
    <div className="mx-auto max-w-7xl">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses Management</h1>
          <p className="text-gray-600">Manage library courses</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Course
        </button>
      </div>

      {/* search */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            placeholder="Search courses..."
            className="w-full rounded-lg border px-10 py-2 focus:border-blue-500 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { k: 'course_name', label: 'Course Name' },
                      { k: 'course_code', label: 'Course Code' },
                      { k: 'department', label: 'Department' },
                      { k: 'total_semesters', label: 'Semesters' },
                      { k: 'is_active', label: 'Status' },
                    ].map(({ k, label }) => (
                      <th
                        key={k}
                        onClick={() => reqSort(k as keyof Course)}
                        className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          {icon(k as keyof Course)}
                        </span>
                      </th>
                    ))}
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filtered.length ? (
                    filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-blue-100">
                              <GraduationCap className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="truncate text-sm font-medium text-gray-900">{c.course_name ?? c.name}</p>
                              <p className="truncate text-sm text-gray-500">
                                {c.description ? `${c.description.slice(0, 60)}${c.description.length > 60 ? '…' : ''}` : 'No description'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            {c.course_code ?? c.code}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{c.department ?? 'N/A'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{c.total_semesters ?? 0}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              c.is_active ?? true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {c.is_active ?? true ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button onClick={() => (setEditing(c), setModalOpen(true))} className="mr-4 text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => delCourse(c.id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        {search ? 'No courses match your search.' : 'No courses available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-sm text-gray-500">
              {filtered.length} course{filtered.length !== 1 && 's'} found
            </div>
          </>
        )}
      </div>

      {/* modal */}
      {modalOpen && (
        <CourseFormModal
          key={editing?.id ?? 'new'}
          course={editing}
          onSave={async (d) => {
            const res = await saveCourse(d);
            // Don't set toast notification in parent component anymore
            // Only the modal component will handle displaying the success/error messages
            if (res.ok) {
              // Close the modal after a delay to show the success message
              setTimeout(() => {
                setModalOpen(false);
              }, 2000);
            }
            return res;
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CoursesManager;

/* ---------- Modal ---------- */

interface ModalProps {
  course: Course | null;
  onSave: (d: Omit<Course, 'id'>) => Promise<{ ok: boolean; message: string }>;
  onClose: () => void;
}
const CourseFormModal: React.FC<ModalProps> = ({ course, onSave, onClose }) => {
  const isEdit = !!course;
  const [varOcg, setVarOcg] = useState<'idle' | 'saving' | 'error'>('idle');
  const [note, setNote] = useState<ToastState | null>(null);
  const [fields, setFields] = useState({
    course_name: course?.course_name ?? course?.name ?? '',
    course_code: course?.course_code ?? course?.code ?? '',
    department: course?.department ?? '',
    description: course?.description ?? '',
    total_semesters: course?.total_semesters ?? 8,
    is_active: course?.is_active ?? true,
  });
  const [errs, setErrs] = useState<Partial<Record<keyof typeof fields, string>>>({});

  const validate = () => {
    const e: typeof errs = {};
    const rxCode = /^[A-Za-z0-9\-]+$/;
    if (!fields.course_name.trim()) e.course_name = 'Required';
    else if (fields.course_name.length > 255) e.course_name = '≤255 chars';
    if (!fields.course_code.trim()) e.course_code = 'Required';
    else if (fields.course_code.length > 50) e.course_code = '≤50 chars';
    else if (!rxCode.test(fields.course_code)) e.course_code = 'Alphanumeric / hyphens only';
    if (!fields.description.trim()) e.description = 'Required';
    else if (fields.description.length > 1000) e.description = '≤1000 chars';
    if (!fields.department.trim()) e.department = 'Required';
    else if (fields.department.length > 255) e.department = '≤255 chars';
    if (fields.total_semesters < 1 || fields.total_semesters > 12) e.total_semesters = '1‑12';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    setFields((f) => ({
      ...f,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : name === 'total_semesters' ? +value : value,
    }));
    if (errs[name as keyof typeof fields]) setErrs((x) => ({ ...x, [name]: undefined }));
    if (note) setNote(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return setNote({ type: 'error', message: 'Fix errors above' });
    setVarOcg('saving');
    const res = await onSave({
      ...fields,
      created_at: course?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (res.ok) {
      setVarOcg('idle');
      setNote({ type: 'success', message: res.message });
    } else {
      setVarOcg('error');
      setNote({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
        <div className="relative w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
          {/* header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">{isEdit ? 'Edit Course' : 'Add New Course'}</h3>
            <button
              onClick={onClose}
              disabled={varOcg === 'saving'}
              className="rounded-md p-1 text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 py-4">
            {note && (
              <div
                className={`mb-4 flex items-center rounded-md p-4 text-sm ${
                  note.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {note.type === 'success' ? (
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                )}
                {note.message}
              </div>
            )}

            {/* form */}
            <form onSubmit={submit} noValidate className="space-y-4">
              {/* name + code */}
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { n: 'course_name', lbl: 'Course Name*', type: 'text' },
                  { n: 'course_code', lbl: 'Course Code*', type: 'text' },
                ].map(({ n, lbl, type }) => (
                  <div key={n}>
                    <label htmlFor={n} className="mb-1 block text-sm font-medium text-gray-700">
                      {lbl}
                    </label>
                    <input
                      id={n}
                      name={n}
                      type={type}
                      value={(fields as any)[n]}
                      onChange={change}
                      disabled={varOcg === 'saving'}
                      className={`w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:ring-blue-500 ${
                        errs[n as keyof typeof fields] ? 'border-red-500 bg-red-50' : ''
                      }`}
                    />
                    {errs[n as keyof typeof fields] && (
                      <p className="mt-1 text-sm text-red-600">{errs[n as keyof typeof fields]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* description */}
              <div>
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={fields.description}
                  onChange={change}
                  disabled={varOcg === 'saving'}
                  className={`w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:ring-blue-500 ${
                    errs.description ? 'border-red-500 bg-red-50' : ''
                  }`}
                />
                {errs.description && <p className="mt-1 text-sm text-red-600">{errs.description}</p>}
              </div>

              {/* dept + semesters */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="department" className="mb-1 block text-sm font-medium text-gray-700">
                    Department*
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={fields.department}
                    onChange={change}
                    disabled={varOcg === 'saving'}
                    className={`w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:ring-blue-500 ${
                      errs.department ? 'border-red-500 bg-red-50' : ''
                    }`}
                  />
                  {errs.department && <p className="mt-1 text-sm text-red-600">{errs.department}</p>}
                </div>
                <div>
                  <label htmlFor="total_semesters" className="mb-1 block text-sm font-medium text-gray-700">
                    Total Semesters*
                  </label>
                  <select
                    id="total_semesters"
                    name="total_semesters"
                    value={fields.total_semesters}
                    onChange={change}
                    disabled={varOcg === 'saving'}
                    className={`w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:ring-blue-500 ${
                      errs.total_semesters ? 'border-red-500 bg-red-50' : ''
                    }`}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Semester' : 'Semesters'}
                      </option>
                    ))}
                  </select>
                  {errs.total_semesters && <p className="mt-1 text-sm text-red-600">{errs.total_semesters}</p>}
                </div>
              </div>

              {/* active */}
              <label className="mb-6 flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={fields.is_active}
                  onChange={change}
                  disabled={varOcg === 'saving'}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>

              <p className="text-xs text-gray-500">* Required fields</p>

              {/* actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={varOcg === 'saving'}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={varOcg === 'saving'}
                  className="flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {varOcg === 'saving' && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-white" />
                  )}
                  {varOcg === 'saving'
                    ? 'Saving…'
                    : isEdit
                    ? 'Update'
                    : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

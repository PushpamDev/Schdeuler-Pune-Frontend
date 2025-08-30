import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Calendar, Users, MoreVertical } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { API_BASE_URL } from "@/lib/api";

// Type definitions
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Availability {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface Faculty {
  id: string;
  name: string;
  type: "full-time" | "part-time";
  skills: Skill[];
  isActive: boolean;
  availability: Availability[];
}

export interface Student {
  id: string;
  name: string;
  admission_number: string;
  phone_number: string;
}

export interface Batch {
  id: string;
  name: string;
  faculty_id: string;
  student_ids: string[];
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  days_of_week: string[];
  skill: Skill;
}

const BATCH_STATUSES: Batch['status'][] = ["Upcoming", "active", "completed"];

// --- Components ---

interface BatchFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  facultyId: string;
  skillId: string;
  maxStudents: number;
  status: "Upcoming" | "active" | "completed";
  studentIds: string[];
  daysOfWeek: string[];
}

interface BatchDialogProps {
  batch?: Batch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BatchFormData) => void;
  allStudents: Student[];
  onStudentAdded: () => void;
}

function BatchDialog({ batch, open, onOpenChange, onSave, allStudents, onStudentAdded }: BatchDialogProps) {
  const [formData, setFormData] = useState<BatchFormData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    facultyId: "",
    skillId: "",
    maxStudents: 30,
    status: "Upcoming",
    studentIds: [],
    daysOfWeek: [],
  });
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentAdmissionNumber, setNewStudentAdmissionNumber] = useState("");
  const [newStudentPhoneNumber, setNewStudentPhoneNumber] = useState("");

  const handleAddStudent = async () => {
    if (newStudentName.trim() && selectedBatch) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/students`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
        body: JSON.stringify({
          name: newStudentName,
          admission_number: newStudentAdmissionNumber,
          phone_number: newStudentPhoneNumber,
        }),
      });

      if (response.ok) {
        const newStudent = await response.json();
        // Assuming the parent component handles the state update
        // and the new student is passed back down.
        // For now, let's just clear the fields.
        setNewStudentName("");
        setNewStudentAdmissionNumber("");
        setNewStudentPhoneNumber("");
        onStudentAdded();
        // We need a way to refresh the student list here.
      } else {
        console.error("Failed to add student");
      }
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facultyRes, skillsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/faculty`),
          fetch(`${API_BASE_URL}/api/skills`),
        ]);
        const facultyData = await facultyRes.json();
        const skillsData = await skillsRes.json();
        setFaculties(Array.isArray(facultyData) ? facultyData : []);
        setSkills(Array.isArray(skillsData) ? skillsData : []);
      } catch (error) {
        console.error("Error fetching faculty and skills:", error);
        setFaculties([]);
        setSkills([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (batch) {
      setFormData({
        name: batch.name,
        description: batch.description || "",
        startDate: batch.start_date ? new Date(batch.start_date).toISOString().split('T')[0] : "",
        endDate: batch.end_date ? new Date(batch.end_date).toISOString().split('T')[0] : "",
        startTime: batch.start_time || "",
        endTime: batch.end_time || "",
        facultyId: batch.faculty?.id || "",
        skillId: batch.skill?.id || "",
        maxStudents: batch.max_students || 30,
        status: batch.status,
        studentIds: batch.students?.map(s => s.id) || [],
        daysOfWeek: batch.days_of_week || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        facultyId: "",
        skillId: "",
        maxStudents: 30,
        status: "Upcoming",
        studentIds: [],
        daysOfWeek: [],
      });
    }
  }, [batch, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const selectedFaculty = faculties.find(f => f.id === formData.facultyId);
  const availableSkills = selectedFaculty ? selectedFaculty.skills : skills;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{batch ? "Edit Batch" : "Create New Batch"}</DialogTitle>
          <DialogDescription>
            {batch ? "Update batch information." : "Create a new batch."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Batch Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStudents">Max Students</Label>
              <Input 
                id="maxStudents" 
                type="number" 
                min="1" 
                value={formData.maxStudents} 
                onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 30 })} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Enter batch description..." 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                type="date" 
                value={formData.startDate} 
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input 
                id="endDate" 
                type="date" 
                value={formData.endDate} 
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input 
                id="startTime" 
                type="time" 
                value={formData.startTime} 
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input 
                id="endTime" 
                type="time" 
                value={formData.endTime} 
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty</Label>
              <Select 
                value={formData.facultyId} 
                onValueChange={(value) => setFormData({ ...formData, facultyId: value, skillId: "" })}
                disabled={isLoading || faculties.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading faculties..." : "Select faculty"} />
                </SelectTrigger>
                <SelectContent>
                  {faculties.filter(f => f.isActive).map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>{faculty.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill">Skill/Subject</Label>
              <Select 
                value={formData.skillId} 
                onValueChange={(value) => setFormData({ ...formData, skillId: value })} 
                disabled={isLoading || !formData.facultyId || availableSkills.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading skills..." : "Select skill"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BATCH_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    checked={formData.daysOfWeek.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`day-${day}`}>{day}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Students</Label>
            <div className="max-h-64 overflow-y-auto rounded-md border p-2">
              {allStudents.map((student) => (
                <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.studentIds.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    className="h-4 w-4"
                  />
                  <span>{student.name} ({student.admission_number})</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
                <Input 
                    placeholder="New Student Name" 
                    value={newStudentName} 
                    onChange={(e) => setNewStudentName(e.target.value)} 
                />
                <Input 
                    placeholder="Admission No." 
                    value={newStudentAdmissionNumber} 
                    onChange={(e) => setNewStudentAdmissionNumber(e.target.value)} 
                />
                <Input 
                    placeholder="Phone No." 
                    value={newStudentPhoneNumber} 
                    onChange={(e) => setNewStudentPhoneNumber(e.target.value)} 
                />
                <Button type="button" onClick={handleAddStudent} disabled={!newStudentName || !newStudentAdmissionNumber}>
                    Add
                </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {batch ? "Update Batch" : "Create Batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface StudentListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchName: string;
  students: Student[];
}

function StudentListDialog({ open, onOpenChange, batchName, students }: StudentListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Students in {batchName}</DialogTitle>
        </DialogHeader>
        <div className="rounded-md border mt-4 max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Admission Number</TableHead>
                <TableHead>Phone Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students && students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.admission_number}</TableCell>
                    <TableCell>{student.phone_number}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No students in this batch.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<Batch | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [facultyRes, skillsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/faculty`),
        fetch(`${API_BASE_URL}/api/skills`),
      ]);
      const facultyData = await facultyRes.json();
      const [batchesRes, facultyRes, skillsRes, studentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/batches`),
        fetch(`${API_BASE_URL}/api/faculty`),
        fetch(`${API_BASE_URL}/api/skills`),
        fetch(`${API_BASE_URL}/api/students`),
      ]);
      const batchesData = await batchesRes.json();
      const facultyData = await facultyRes.json();
      setBatches(await batchesRes.json());
      setFaculties(await facultyRes.json());
      setSkills(await skillsRes.json());
      setAllStudents(await studentsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddBatch = () => {
    setSelectedBatch(undefined);
    setIsDialogOpen(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsDialogOpen(true);
  };

  const handleViewStudents = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsStudentListOpen(true);
  };

  const handleSaveBatch = async (data: BatchFormData) => {
    // Validation for faculty availability and batch clashes
    if (data.facultyId && data.daysOfWeek.length > 0) {
      const faculty = faculties.find(f => f.id === data.facultyId);
      if (faculty) {
        const batchStartDate = new Date(data.startDate);
        const batchEndDate = new Date(data.endDate);

        const timeToMinutes = (time: string) => {
          if (!time) return 0;
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const batchStartMinutes = timeToMinutes(data.startTime);
        const batchEndMinutes = timeToMinutes(data.endTime);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // 1. Validate against faculty availability for selected days
        for (const dayOfWeek of data.daysOfWeek) {
          const facultyAvailabilityForDay = faculty.availability.find(a => a.day_of_week.toLowerCase() === dayOfWeek.toLowerCase());

          if (!facultyAvailabilityForDay) {
            toast.error(`Faculty ${faculty.name} is not available on ${dayOfWeek}.`);
            return;
          }

          const facultyStartMinutes = timeToMinutes(facultyAvailabilityForDay.start_time);
          const facultyEndMinutes = timeToMinutes(facultyAvailabilityForDay.end_time);

          if (batchStartMinutes < facultyStartMinutes || batchEndMinutes > facultyEndMinutes) {
            toast.error(`Batch time on ${dayOfWeek} is outside of faculty's available hours.`, {
              description: `Available: ${facultyAvailabilityForDay.start_time} - ${facultyAvailabilityForDay.end_time}. You tried: ${data.startTime} - ${data.endTime}.`,
            });
            return;
          }
        }

        // 2. Validate against other batches for the same faculty on selected days
        const facultyBatches = batches.filter(b => 
          b.faculty?.id === data.facultyId && 
          (!selectedBatch || b.id !== selectedBatch.id)
        );

        for (let d = new Date(batchStartDate); d <= batchEndDate; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = dayNames[d.getDay()];
          if (data.daysOfWeek.includes(dayOfWeek)) {
            for (const existingBatch of facultyBatches) {
              if (existingBatch.days_of_week?.includes(dayOfWeek)) {
                const newStarts = new Date(data.startDate);
                const newEnds = new Date(data.endDate);
                const existingStarts = new Date(existingBatch.start_date);
                const existingEnds = new Date(existingBatch.end_date);

                if (newStarts <= existingEnds && newEnds >= existingStarts) {
                  const newStartTime = timeToMinutes(data.startTime);
                  const newEndTime = timeToMinutes(data.endTime);
                  const existingStartTime = timeToMinutes(existingBatch.start_time);
                  const existingEndTime = timeToMinutes(existingBatch.end_time);

                  if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
                    toast.error("Scheduling conflict", {
                      description: `On ${dayOfWeek}, the new batch clashes with "${existingBatch.name}" which runs from ${existingBatch.start_date} to ${existingBatch.end_date} at ${existingBatch.start_time} - ${existingBatch.end_time}.`
                    });
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }

    const method = selectedBatch ? "PUT" : "POST";
    const url = selectedBatch
      ? `http://localhost:3001/api/batches/${selectedBatch.id}`
      : "http://localhost:3001/api/batches";

    const payload = {
      ...data,
      facultyId: data.facultyId || null,
      skillId: data.skillId || null,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchData();
        setIsDialogOpen(false);
      } else {
        const errorData = await response.json();
        console.error("Failed to save batch:", errorData);
        alert(`Failed to save batch: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving batch:", error);
      alert(`Error saving batch: ${(error as Error).message}`);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/batches/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchData();
        } else {
          console.error("Failed to delete batch");
        }
      } catch (error) {
        console.error("Error deleting batch:", error);
      }
    }
  };

  const getStatus = (startDate: string, endDate: string): Batch['status'] => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start) return "Upcoming";
    if (now > end) return "completed";
    return "active";
  };

  const getStatusColor = (status: Batch['status']) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "Upcoming":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Render
  return (
    <div className="space-y-6 p-6">
      <Toaster richColors />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
        <Button onClick={handleAddBatch}>
          <Plus className="h-4 w-4 mr-2" />
          Create Batch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <CardDescription>View, create, and manage your batches.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search batches..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredBatches.length} of {batches.length} batches
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length > 0 ? (
                  filteredBatches.map((batch) => {
                    const status = getStatus(batch.start_date, batch.end_date);
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(batch.start_date).toLocaleDateString()} ({batch.start_time}) -{" "}
                              {new Date(batch.end_date).toLocaleDateString()} ({batch.end_time})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(status)}>{status}</Badge>
                        </TableCell>
                        <TableCell>{batch.faculty?.name || "N/A"}</TableCell>
                        <TableCell>{batch.skill?.name || "N/A"}</TableCell>
                        <TableCell>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto" 
                            onClick={() => handleViewStudents(batch)}
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {batch.students?.length || 0}
                            </div>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEditBatch(batch)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteBatch(batch.id)} 
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No batches found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isDialogOpen && (
        <BatchDialog
          batch={selectedBatch}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveBatch}
          allStudents={allStudents}
          onStudentAdded={fetchData}
        />
      )}

      {isStudentListOpen && selectedBatch && (
        <StudentListDialog
          open={isStudentListOpen}
          onOpenChange={setIsStudentListOpen}
          batchName={selectedBatch.name}
          students={selectedBatch.students || []}
        />
      )}
    </div>
  );
}
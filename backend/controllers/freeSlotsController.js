const supabase = require('../db.js');

const getFreeSlots = async (req, res) => {
    const { startDate, endDate, selectedFaculty, selectedSkill } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Please select a start and end date.' });
    }

    try {
        // 1. Fetch all data
        let facultyQuery = supabase
            .from('faculty')
            .select(`
                id,
                name,
                skills ( id, name ),
                availability:faculty_availability ( day_of_week, start_time, end_time )
            `);

        if (selectedFaculty) {
            facultyQuery = facultyQuery.eq('id', selectedFaculty);
        }

        const { data: faculties, error: facultiesError } = await facultyQuery;
        if (facultiesError) throw facultiesError;

        const { data: batches, error: batchesError } = await supabase
            .from('batches')
            .select(`
                id,
                name,
                start_date,
                end_date,
                start_time,
                end_time,
                days_of_week,
                faculty_id
            `);
        if (batchesError) throw batchesError;

        // 2. Filter faculties by skill if selected
        let filteredFaculties = faculties;
        if (selectedSkill) {
            filteredFaculties = filteredFaculties.filter(f =>
                f.skills.some(s => s.id === selectedSkill)
            );
        }

        // 3. The rest of the logic from the frontend's handleSearch
        const results = [];
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        filteredFaculties.forEach(faculty => {
            const facultySlots = { faculty, slots: [] };
            
            const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
            let currentDate = new Date(Date.UTC(sYear, sMonth - 1, sDay));
            const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
            const lastDate = new Date(Date.UTC(eYear, eMonth - 1, eDay));

            while (currentDate <= lastDate) {
                const dayOfWeek = dayNames[currentDate.getUTCDay()];
                const dateStr = currentDate.toISOString().split('T')[0];

                const dailyAvailability = faculty.availability.find(a => a.day_of_week.toLowerCase() === dayOfWeek.toLowerCase());
                if (!dailyAvailability) {
                    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                    continue;
                }

                const dailyBatches = batches.filter(b => {
                    if (!b.faculty_id || !b.days_of_week) return false;

                    const [bsYear, bsMonth, bsDay] = b.start_date.split('-').map(Number);
                    const batchStartDate = new Date(Date.UTC(bsYear, bsMonth - 1, bsDay));
                    const [beYear, beMonth, beDay] = b.end_date.split('-').map(Number);
                    const batchEndDate = new Date(Date.UTC(beYear, beMonth - 1, beDay));

                    const runsOnDay = b.days_of_week.some(d => d.toLowerCase() === dayOfWeek.toLowerCase());

                    return b.faculty_id === faculty.id &&
                        batchStartDate <= currentDate &&
                        batchEndDate >= currentDate &&
                        runsOnDay;
                });

                let timeSlots = [{ start: dailyAvailability.start_time, end: dailyAvailability.end_time }];

                dailyBatches.forEach(batch => {
                    const newTimeSlots = [];
                    timeSlots.forEach(slot => {
                        if (batch.end_time <= slot.start || batch.start_time >= slot.end) {
                            newTimeSlots.push(slot);
                            return;
                        }
                        if (batch.start_time > slot.start) {
                            newTimeSlots.push({ start: slot.start, end: batch.start_time });
                        }
                        if (batch.end_time < slot.end) {
                            newTimeSlots.push({ start: batch.end_time, end: slot.end });
                        }
                    });
                    timeSlots = newTimeSlots;
                });

                if (timeSlots.length > 0 && timeSlots.some(s => s.start < s.end)) {
                    facultySlots.slots.push({
                        date: dateStr,
                        time: timeSlots.filter(s => s.start < s.end).map(s => `${s.start} - ${s.end}`)
                    });
                }

                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }

            if (facultySlots.slots.length > 0) {
                results.push(facultySlots);
            }
        });

        res.json(results);

    } catch (error) {
        console.error('Error fetching free slots:', error);
        res.status(500).json({ error: 'Failed to fetch free slots' });
    }
};

module.exports = {
    getFreeSlots,
};
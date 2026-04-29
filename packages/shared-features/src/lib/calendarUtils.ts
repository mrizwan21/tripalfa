interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  bookings: any[];
}

export function generateCalendarMatrix(month: number, year: number, bookings: any[] = []): CalendarDay[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday

  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay())); // End on Saturday

  const matrix: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === currentDate.toDateString();
    });

    currentWeek.push({
      date: new Date(currentDate),
      isCurrentMonth: currentDate.getMonth() === month,
      bookings: dayBookings
    });

    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return matrix;
}
import { SalaryCalculator } from './components/SalaryCalculator/SalaryCalculator';
import { useSalaryCalculator } from './hooks/useSalaryCalculator';
import { Notes } from './components/Notes/Notes';
import './App.css';

function App() {
  const {
    currentYear,
    currentMonth,
    monthData,
    updateRates,
    updateDay,
    navigateMonth,
    goToToday
  } = useSalaryCalculator();

  return (
    <div className="App">
      <main className="App-main">
        <SalaryCalculator
          monthData={monthData}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onUpdateRates={updateRates}
          onUpdateDay={updateDay}
          onNavigateMonth={navigateMonth}
          onGoToToday={goToToday}
        />
        <Notes />
        <button className="clear-text" onClick={() => { if (window.confirm('Очистить все данные?')) { localStorage.removeItem('salaryCalculator'); window.location.reload(); } }}>сбросить данные</button>
      </main>
    </div>
  );
}

export default App;

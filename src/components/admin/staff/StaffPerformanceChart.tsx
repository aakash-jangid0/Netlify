import React from 'react';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Review {
  id: string;
  staff_id: string;
  review_date: string;
  rating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  goals_achieved: string[];
  areas_of_improvement: string[];
  comments: string;
  next_review_date: string;
}

interface StaffPerformanceChartProps {
  reviews: Review[];
  chartType: 'line' | 'bar' | 'radar';
}

const StaffPerformanceChart: React.FC<StaffPerformanceChartProps> = ({ reviews, chartType }) => {
  // Convert rating to numerical value for charting
  const getRatingValue = (rating: string): number => {
    switch (rating) {
      case 'excellent': return 5;
      case 'good': return 4;
      case 'satisfactory': return 3;
      case 'needs_improvement': return 2;
      case 'unsatisfactory': return 1;
      default: return 0;
    }
  };

  // Sort reviews chronologically
  const sortedReviews = [...reviews].sort((a, b) => 
    new Date(a.review_date).getTime() - new Date(b.review_date).getTime()
  );

  // Format dates for labels
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const labels = sortedReviews.map(review => formatDate(review.review_date));
  
  // Performance rating data
  const performanceData = sortedReviews.map(review => getRatingValue(review.rating));
  
  // Goals achievement data - count number of goals achieved
  const goalsData = sortedReviews.map(review => 
    Array.isArray(review.goals_achieved) ? review.goals_achieved.length : 0
  );
  
  // Areas for improvement data - count number of areas
  const areasData = sortedReviews.map(review => 
    Array.isArray(review.areas_of_improvement) ? review.areas_of_improvement.length : 0
  );

  // Line chart data
  const lineData = {
    labels,
    datasets: [
      {
        label: 'Performance Rating',
        data: performanceData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Goals Achieved',
        data: goalsData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  // Bar chart data
  const barData = {
    labels,
    datasets: [
      {
        label: 'Performance Rating',
        data: performanceData,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderWidth: 0,
        borderRadius: 4
      },
      {
        label: 'Goals Achieved',
        data: goalsData,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderWidth: 0,
        borderRadius: 4
      },
      {
        label: 'Areas for Improvement',
        data: areasData,
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
        borderWidth: 0,
        borderRadius: 4
      }
    ]
  };

  // Radar chart data
  const radarData = {
    labels,
    datasets: [
      {
        label: 'Performance Rating',
        data: performanceData,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgb(16, 185, 129)',
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(16, 185, 129)'
      },
      {
        label: 'Goals Achieved',
        data: goalsData,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)'
      }
    ]
  };

  // Common options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            
            if (label === 'Performance Rating') {
              const ratingLabels = ['', 'Unsatisfactory', 'Needs Improvement', 'Satisfactory', 'Good', 'Excellent'];
              return `${label}: ${ratingLabels[value] || value}`;
            }
            
            return `${label}: ${value}`;
          }
        }
      }
    },
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Line data={lineData} options={options} height={300} />;
      case 'bar':
        return <Bar data={barData} options={options} height={300} />;
      case 'radar':
        return <Radar data={radarData} options={options} height={300} />;
      default:
        return <Line data={lineData} options={options} height={300} />;
    }
  };

  return (
    <div className="h-[300px] w-full">
      {renderChart()}
    </div>
  );
};

export default StaffPerformanceChart;

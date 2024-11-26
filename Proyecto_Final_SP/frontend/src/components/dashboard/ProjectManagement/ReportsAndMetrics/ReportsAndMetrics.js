// components/dashboard/ProjectManagement/ReportsAndMetrics/ReportsAndMetrics.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './ReportsAndMetrics.css';

// Importar componentes y registrar elementos de Chart.js
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const ReportsAndMetrics = () => {
  const { id } = useParams(); // Se obtiene el id del proyecto
  const [metrics, setMetrics] = useState(null); // Estado para almacenar las métricas
  const navigate = useNavigate();

  useEffect(() => {
    fetchMetrics();
  }, [id]);

  // Función para obtener las métricas desde el backend
  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/proyectos/${id}/metricas`);
      console.log('Métricas obtenidas:', response.data); // Verificar los datos recibidos
      setMetrics(response.data);
    } catch (error) {
      console.error('Error al obtener métricas:', error);
    }
  };

  const handleBack = () => {
    navigate(`/proyectos/${id}`);
  };

  if (!metrics) return <p>Cargando métricas...</p>;

  // Preparar datos para las gráficas

  // Gráfico de Cobertura de Pruebas
  const coverageData = {
    labels: ['Cobertura', 'Sin Cobertura'],
    datasets: [
      {
        data: [metrics.coverage, 100 - metrics.coverage],
        backgroundColor: ['#4BC0C0', '#CCCCCC'],
        hoverBackgroundColor: ['#4BC0C0', '#CCCCCC'],
      },
    ],
  };

  // Gráfico de Defectos Encontrados y Corregidos
  const defectsData = {
    labels: ['Defectos Encontrados', 'Defectos Corregidos'],
    datasets: [
      {
        label: 'Defectos',
        data: [metrics.defects_found, metrics.defects_fixed],
        backgroundColor: ['#FFCE56', '#81C784'],
      },
    ],
  };

  const testCasesData = {
    labels: ['Casos Exitosos', 'Casos Fallidos'],
    datasets: [
      {
        data: [metrics.passed_test_cases, metrics.failed_test_cases],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  // Gráfico de Porcentaje de Defectos Críticos
  const criticalDefectsData = {
    labels: ['Defectos Críticos', 'Otros Defectos'],
    datasets: [
      {
        data: [metrics.critical_defects_percentage, 100 - metrics.critical_defects_percentage],
        backgroundColor: ['#FF6384', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#FFCE56'],
      },
    ],
  };

  // Gráfico de Defectos por Usuario
  const defectsPerUserData = {
    labels: metrics.defects_per_user.map(user => user.user_name),
    datasets: [
      {
        label: 'Defectos Abiertos',
        data: metrics.defects_per_user.map(user => user.open_defects),
        backgroundColor: '#FF6384',
      },
      {
        label: 'Defectos Cerrados',
        data: metrics.defects_per_user.map(user => user.closed_defects),
        backgroundColor: '#36A2EB',
      },
    ],
  };

  // Opciones para los gráficos
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    maintainAspectRatio: false,
  };

  const pieChartOptions = {
    maintainAspectRatio: false,
  };

  return (
    <div className="reports-and-metrics-container">
      <h1>Informes y Métricas del Proyecto</h1>
      <button onClick={handleBack} className="back-button">Regresar</button>
      <div className="metrics-content">

        {/* Tabla de información */}
        <h2>Cobertura de Pruebas</h2>
        <p>{metrics.coverage ? metrics.coverage.toFixed(2) : 0}%</p>

        <h2>Tasa de Defectos Encontrados y Corregidos</h2>
        <p>Defectos Encontrados: {metrics.defects_found !== undefined ? metrics.defects_found : 0}</p>
        <p>Defectos Corregidos: {metrics.defects_fixed !== undefined ? metrics.defects_fixed : 0}</p>

        <h2>Tiempo Promedio de Resolución de Defectos</h2>
        <p>{metrics.average_resolution_time ? metrics.average_resolution_time.toFixed(2) : 0} horas</p>

        <h2>Casos de Prueba Exitosos y Fallidos</h2>
        <p>Casos Exitosos: {metrics.passed_test_cases !== undefined ? metrics.passed_test_cases : 0}</p>
        <p>Casos Fallidos: {metrics.failed_test_cases !== undefined ? metrics.failed_test_cases : 0}</p>

        <h2>Porcentaje de Defectos Críticos</h2>
        <p>{metrics.critical_defects_percentage ? metrics.critical_defects_percentage.toFixed(2) : 0}%</p>

        <h2>Defectos por Usuario</h2>
        {metrics.defects_per_user && metrics.defects_per_user.length > 0 ? (
          <table className="defects-per-user-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Defectos Abiertos</th>
                <th>Defectos Cerrados</th>
              </tr>
            </thead>
            <tbody>
              {metrics.defects_per_user.map(user => (
                <tr key={user.user_id}>
                  <td>{user.user_name}</td>
                  <td>{user.open_defects}</td>
                  <td>{user.closed_defects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay defectos registrados por usuario.</p>
        )}

        {/* Gráficas */}
        <div className="charts-container">
          <h2>Gráficos de Métricas</h2>

          <div className="chart">
            <h3>Cobertura de Pruebas</h3>
            <div className="chart-container">
              <Pie data={coverageData} options={pieChartOptions} />
            </div>
          </div>

          <div className="chart">
            <h3>Tasa de Defectos Encontrados y Corregidos</h3>
            <div className="chart-container">
              <Bar data={defectsData} options={barChartOptions} />
            </div>
          </div>

          <div className="chart">
            <h3>Casos de Prueba Exitosos y Fallidos</h3>
            <div className="chart-container">
              <Pie data={testCasesData} options={pieChartOptions} />
            </div>
          </div>

          <div className="chart">
            <h3>Porcentaje de Defectos Críticos</h3>
            <div className="chart-container">
              <Pie data={criticalDefectsData} options={pieChartOptions} />
            </div>
          </div>

          <div className="chart">
            <h3>Defectos por Usuario</h3>
            {metrics.defects_per_user && metrics.defects_per_user.length > 0 ? (
              <div className="chart-container">
                <Bar data={defectsPerUserData} options={barChartOptions} />
              </div>
            ) : (
              <p>No hay defectos registrados por usuario.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ReportsAndMetrics;

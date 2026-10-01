/**
 * Data Verification Utility
 * 
 * This utility provides functions to verify that data is being processed correctly
 * throughout the AFES system.
 */

import { store } from '../store';

export interface DataVerificationReport {
  timestamp: string;
  totalEvaluations: number;
  facultyMetrics: {
    [facultyId: string]: {
      name: string;
      totalSubmissions: number;
      overallAverage: number;
      criteriaAverages: { [criterionId: string]: number };
      verified: boolean;
    };
  };
  dataIntegrity: {
    allEvaluationsHaveRatings: boolean;
    allRatingsInRange: boolean;
    metricsMatchEvaluations: boolean;
  };
}

/**
 * Verify that all data is being processed correctly
 */
export function verifyDataIntegrity(): DataVerificationReport {
  const report: DataVerificationReport = {
    timestamp: new Date().toISOString(),
    totalEvaluations: 0,
    facultyMetrics: {},
    dataIntegrity: {
      allEvaluationsHaveRatings: true,
      allRatingsInRange: true,
      metricsMatchEvaluations: true,
    },
  };

  // Get all evaluations
  const allEvaluations = store.getEvaluations();
  report.totalEvaluations = allEvaluations.length;

  // Verify each evaluation has ratings and they're in valid range
  allEvaluations.forEach(eval_ => {
    if (!eval_.ratings || Object.keys(eval_.ratings).length === 0) {
      report.dataIntegrity.allEvaluationsHaveRatings = false;
    }

    Object.values(eval_.ratings).forEach(rating => {
      if (rating < 1 || rating > 5) {
        report.dataIntegrity.allRatingsInRange = false;
      }
    });
  });

  // Verify metrics for each faculty
  const faculty = store.getFaculty();
  const activeCycle = store.getActiveCycle();

  faculty.forEach(f => {
    const metrics = store.getFacultyMetrics(f.id, activeCycle?.id);
    
    // Calculate expected metrics from raw evaluations
    const facultyEvals = allEvaluations.filter(e => 
      e.facultyId === f.id && 
      e.cycleId === activeCycle?.id
    );

    let expectedTotal = 0;
    let expectedSum = 0;
    const expectedCriteriaSums: { [key: string]: number } = {};
    const expectedCriteriaCounts: { [key: string]: number } = {};

    facultyEvals.forEach(eval_ => {
      const ratings = Object.values(eval_.ratings);
      expectedTotal++;
      expectedSum += ratings.reduce((a, b) => a + b, 0);

      // Group by criterion
      Object.entries(eval_.ratings).forEach(([sqId, rating]) => {
        const subQuestion = store.getSubQuestions().find(sq => sq.id === sqId);
        if (subQuestion) {
          const critId = subQuestion.criterionId;
          if (!expectedCriteriaSums[critId]) {
            expectedCriteriaSums[critId] = 0;
            expectedCriteriaCounts[critId] = 0;
          }
          expectedCriteriaSums[critId] += rating;
          expectedCriteriaCounts[critId]++;
        }
      });
    });

    const expectedAverage = expectedTotal > 0 ? expectedSum / (expectedTotal * 15) : 0; // 15 sub-questions

    // Calculate expected criteria averages
    const expectedCriteriaAverages: { [key: string]: number } = {};
    Object.keys(expectedCriteriaSums).forEach(critId => {
      expectedCriteriaAverages[critId] = expectedCriteriaCounts[critId] > 0
        ? expectedCriteriaSums[critId] / expectedCriteriaCounts[critId]
        : 0;
    });

    // Verify metrics match
    const metricsMatch = 
      metrics.totalSubmissions === expectedTotal &&
      Math.abs(metrics.overallAverage - expectedAverage) < 0.01;

    if (!metricsMatch) {
      report.dataIntegrity.metricsMatchEvaluations = false;
    }

    report.facultyMetrics[f.id] = {
      name: f.name,
      totalSubmissions: metrics.totalSubmissions,
      overallAverage: metrics.overallAverage,
      criteriaAverages: metrics.criteriaAverages,
      verified: metricsMatch,
    };
  });

  return report;
}

/**
 * Log verification report to console
 */
export function logVerificationReport(): void {
  const report = verifyDataIntegrity();
  
  console.log('=== AFES Data Verification Report ===');
  console.log('Timestamp:', report.timestamp);
  console.log('Total Evaluations:', report.totalEvaluations);
  console.log('\nData Integrity:');
  console.log('  ✓ All evaluations have ratings:', report.dataIntegrity.allEvaluationsHaveRatings);
  console.log('  ✓ All ratings in range (1-5):', report.dataIntegrity.allRatingsInRange);
  console.log('  ✓ Metrics match evaluations:', report.dataIntegrity.metricsMatchEvaluations);
  
  console.log('\nFaculty Metrics:');
  Object.entries(report.facultyMetrics).forEach(([id, data]) => {
    console.log(`  ${data.name} (${id}):`);
    console.log(`    Submissions: ${data.totalSubmissions}`);
    console.log(`    Overall Average: ${data.overallAverage.toFixed(2)}`);
    console.log(`    Verified: ${data.verified ? '✓' : '✗'}`);
  });
  
  console.log('\n=====================================');
}

/**
 * Get summary statistics for debugging
 */
export function getDataSummary(): {
  totalFaculty: number;
  totalStudents: number;
  totalCycles: number;
  totalEvaluations: number;
  totalCriteria: number;
  totalSubQuestions: number;
  activeCycle: string | undefined;
} {
  return {
    totalFaculty: store.getFaculty().length,
    totalStudents: store.getStudents().length,
    totalCycles: store.getCycles().length,
    totalEvaluations: store.getEvaluations().length,
    totalCriteria: store.getCriteria().length,
    totalSubQuestions: store.getSubQuestions().length,
    activeCycle: store.getActiveCycle()?.id,
  };
}

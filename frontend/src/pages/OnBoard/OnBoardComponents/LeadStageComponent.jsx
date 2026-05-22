import React, { useState } from 'react';

const leadStageStyles = `
  .leadstage-container {
    padding: 2rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  .leadstage-container h3 {
    margin-bottom: 1.5rem;
    font-weight: 600;
    font-size: 1.8rem;
  }
  .arrow-stage-flow {
    display: flex;
    gap: 2px;
    flex-wrap: nowrap;
    align-items: flex-start;
    overflow-x: auto;
    padding-bottom: 1rem;
    position: relative;
  }
  .stage-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 160px;
    flex-shrink: 0;
  }
  .arrow-stage {
    position: relative;
    padding: 10px 16px 10px 20px;
    color: white;
    font-weight: 500;
    font-size: 0.95rem;
    text-align: center;
    background-color: #c0cfe6;
    clip-path: polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%);
    transition: background-color 0.3s ease;
    width: 160px;
  }
  .arrow-stage.completed {
    background-color: #d2e6f9;
    color: #444;
  }
  .arrow-stage.current {
    background-color: #4a90e2;
    font-weight: bold;
  }
  .arrow-stage.upcoming {
    background-color: #e0e0e0;
    color: #777;
  }
  .arrow-stage.last {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 12px 50%);
  }
  .data-box {
    margin-top: 10px;
    padding: 10px 12px;
    background-color: #f7f9fb;
    border: 1px solid #d0d7e1;
    border-radius: 8px;
    min-width: 140px;
    font-size: 0.9rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
  .data-box label {
    font-weight: 500;
    display: block;
    margin-bottom: 4px;
    font-size: 0.85rem;
    color: #333;
  }
  .data-box input,
  .data-box select {
    width: 100%;
    padding: 5px 6px;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 0.9rem;
  }
  .data-box span {
    display: block;
    color: #222;
  }
  .edit-btn,
  .save-btn,
  .cancel-btn,
  .next-btn {
    margin-top: 15px;
    padding: 8px 14px;
    font-size: 0.9rem;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .edit-btn {
    background-color: #4a90e2;
    color: white;
  }
  .save-btn {
    background-color: #28a745;
    color: white;
    margin-right: 10px;
  }
  .cancel-btn {
    background-color: #dc3545;
    color: white;
  }
  .next-btn {
    background-color: #f0ad4e;
    color: white;
    margin-right: 10px;
  }
  .edit-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
  }
`;

const LeadStageComponent = () => {
  const stages = ['New', 'Contacted', 'Interested', 'Qualified', 'Won/Lost'];

  const reasons = [
    'General Enquiry',
    'Price Issue',
    'Location Issue',
    'Duplicate Customer',
    'Invalid Number',
    'Not Interested',
    'Timing Issue',
    'No Conversation',
  ];

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [pipelineCompleted, setPipelineCompleted] = useState(false);

  const [stageData, setStageData] = useState({
    New: { registeredAt: new Date().toLocaleString() },
    Contacted: { attempts: 0 },
    Interested: { status: 'Hot' },
    Qualified: { outcome: '', reason: '' },
    'Won/Lost': { completedAt: '', result: '' },
  });

  const updateStageField = (stage, field, value) => {
    setStageData((prev) => ({
      ...prev,
      [stage]: { ...prev[stage], [field]: value },
    }));
  };

  const handleSave = () => {
    const currentStage = stages[currentStageIndex];
    if (currentStage === 'Qualified') {
      const outcome = stageData.Qualified.outcome;
      const dateTime = new Date().toLocaleString();
      if (outcome === 'Customer') {
        updateStageField('Won/Lost', 'completedAt', dateTime);
        updateStageField('Won/Lost', 'result', 'Won');
        setPipelineCompleted(true);
        setEditing(false);
        return;
      } else if (outcome === 'Unqualified') {
        updateStageField('Won/Lost', 'completedAt', dateTime);
        updateStageField('Won/Lost', 'result', 'Lost');
        setPipelineCompleted(true);
        setEditing(false);
        return;
      }
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const moveToNextStage = () => {
    if (currentStageIndex < stages.length - 2) {
      setCurrentStageIndex(currentStageIndex + 1);
      setEditing(false);
    }
  };

  const renderDataBox = (stage, index) => {
    if (index > currentStageIndex) return null;
    const isEditable = editing && index === currentStageIndex;

    switch (stage) {
      case 'New':
        return (
          <div className="data-box">
            <label>Registered At:</label>
            <span>{stageData.New.registeredAt}</span>
          </div>
        );
      case 'Contacted':
        return (
          <div className="data-box">
            <label>No. of Attempts:</label>
            {isEditable ? (
              <input
                type="number"
                min={0}
                value={stageData.Contacted.attempts}
                onChange={(e) => updateStageField('Contacted', 'attempts', e.target.value)}
              />
            ) : (
              <span>{stageData.Contacted.attempts}</span>
            )}
          </div>
        );
      case 'Interested':
        return (
          <div className="data-box">
            <label>Status:</label>
            {isEditable ? (
              <select
                value={stageData.Interested.status}
                onChange={(e) => updateStageField('Interested', 'status', e.target.value)}
              >
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>
            ) : (
              <span>{stageData.Interested.status}</span>
            )}
          </div>
        );
      case 'Qualified':
        return (
          <div className="data-box">
            <label>Outcome:</label>
            {isEditable ? (
              <>
                <select
                  value={stageData.Qualified.outcome}
                  onChange={(e) => updateStageField('Qualified', 'outcome', e.target.value)}
                >
                  <option value="">Choose</option>
                  <option value="Customer">Customer</option>
                  <option value="Unqualified">Unqualified</option>
                </select>
                {stageData.Qualified.outcome === 'Unqualified' && (
                  <>
                    <label>Reason:</label>
                    <select
                      value={stageData.Qualified.reason}
                      onChange={(e) => updateStageField('Qualified', 'reason', e.target.value)}
                    >
                      <option value="">Choose</option>
                      {reasons.map((r, i) => (
                        <option key={i} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </>
            ) : (
              <>
                <span>{stageData.Qualified.outcome}</span>
                {stageData.Qualified.outcome === 'Unqualified' && (
                  <span> — {stageData.Qualified.reason}</span>
                )}
              </>
            )}
          </div>
        );
      case 'Won/Lost':
        return stageData['Won/Lost'].completedAt ? (
          <div className={`data-box final-stage ${stageData['Won/Lost'].result === 'Won' ? 'won' : 'lost'}`}>
            <label>{stageData['Won/Lost'].result}:</label>
            <span>{stageData['Won/Lost'].completedAt}</span>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="leadstage-container">
      <style>{leadStageStyles}</style>
      <h3>Lifecycle Stage</h3>
      <div className="arrow-stage-flow">
        {stages.map((stage, i) => {
          const isCompleted = i < currentStageIndex;
          const isCurrent = i === currentStageIndex;
          const isLast = i === stages.length - 1;

          const wonLostState = stage === 'Won/Lost' && stageData['Won/Lost'].result;

          return (
            <div key={stage} className="stage-group">
              <div
                className={`arrow-stage ${
                  wonLostState
                    ? wonLostState === 'Won'
                      ? 'won' // Apply green style
                      : 'lost' // Apply red style
                    : isCompleted
                    ? 'completed'
                    : isCurrent
                    ? 'current'
                    : 'upcoming'
                } ${isLast ? 'last' : ''}`}
              >
                {wonLostState ? wonLostState : stage}
              </div>
              {renderDataBox(stage, i)}
            </div>
          );
        })}

        {!pipelineCompleted && !editing && (
          <button className="edit-btn" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}

        {editing && (
          <div className="edit-controls">
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
            {currentStageIndex < stages.length - 2 && (
              <button className="next-btn" onClick={moveToNextStage}>
                Move to Next Stage
              </button>
            )}
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadStageComponent;

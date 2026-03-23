import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';

interface Feature {
  id: string;
  name: string;
  type: 'toggle' | 'input' | 'dropdown';
  value: any;
}

const AdminDynamicFeatures: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [newFeature, setNewFeature] = useState({ name: '', type: 'toggle' as const });

  useEffect(() => {
    const featuresRef = db.ref('dynamicFeatures');
    featuresRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const featuresList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setFeatures(featuresList);
    });
    return () => featuresRef.off('value');
  }, []);

  const addFeature = async () => {
    if (!newFeature.name) return;
    await db.ref('dynamicFeatures').push({
      ...newFeature,
      value: newFeature.type === 'toggle' ? false : ''
    });
    setNewFeature({ name: '', type: 'toggle' });
  };

  const deleteFeature = async (id: string) => {
    await db.ref(`dynamicFeatures/${id}`).remove();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
        <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-gray-800">Add New Feature</h3>
        <div className="flex gap-4">
          <input 
            type="text" 
            className="flex-grow p-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
            placeholder="Feature Name"
            value={newFeature.name}
            onChange={e => setNewFeature({...newFeature, name: e.target.value})}
          />
          <select 
            className="p-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
            value={newFeature.type}
            onChange={e => setNewFeature({...newFeature, type: e.target.value as any})}
          >
            <option value="toggle">Toggle</option>
            <option value="input">Input</option>
            <option value="dropdown">Dropdown</option>
          </select>
          <button onClick={addFeature} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs shadow-lg">Add</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
        <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-gray-800">Existing Features</h3>
        <div className="space-y-4">
          {features.map(feature => (
            <div key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-xs font-bold">{feature.name} ({feature.type})</span>
              <button onClick={() => deleteFeature(feature.id)} className="text-red-500 text-xs font-bold uppercase">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDynamicFeatures;

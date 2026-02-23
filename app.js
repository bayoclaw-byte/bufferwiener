// Global data
let allConfigs = [];

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        allConfigs = data.configurations;
        
        renderTable(allConfigs);
        setupEventListeners();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('config-tbody').innerHTML = '<tr><td colspan="9">Error loading data</td></tr>';
    }
});

// Setup all event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Filters
    document.getElementById('filter-barrel').addEventListener('change', applyFilters);
    document.getElementById('filter-suppressor').addEventListener('change', applyFilters);
    document.getElementById('filter-ammo').addEventListener('change', applyFilters);
    document.getElementById('filter-frt').addEventListener('change', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);

    // Table sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.sort));
    });

    // Build helper
    document.getElementById('get-recommendation').addEventListener('click', getRecommendation);

    // Submit form
    document.getElementById('submit-form').addEventListener('submit', handleSubmit);
}

// Tab switching
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

// Render table
function renderTable(configs) {
    const tbody = document.getElementById('config-tbody');
    
    if (configs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #999;">No configurations match your filters</td></tr>';
        return;
    }

    tbody.innerHTML = configs.map((config, index) => `
        <tr>
            <td><strong>${config.Configuration}</strong></td>
            <td>${config['Barrel Length']}</td>
            <td>${config['Buffer Type']}</td>
            <td>${config['Buffer Weight (oz)']}</td>
            <td>${config['Spring Type']}</td>
            <td>${config['Ammo Type']}</td>
            <td>${config['Suppressor Type']}</td>
            <td>${config.FRT}</td>
            <td><button class="details-btn" onclick="showDetails(${index})">Details</button></td>
        </tr>
    `).join('');

    updateCount(configs.length);
}

// Apply filters
function applyFilters() {
    const barrelFilter = document.getElementById('filter-barrel').value;
    const suppressorFilter = document.getElementById('filter-suppressor').value;
    const ammoFilter = document.getElementById('filter-ammo').value;
    const frtFilter = document.getElementById('filter-frt').value;

    let filtered = allConfigs.filter(config => {
        // Barrel filter
        if (barrelFilter && !config['Barrel Length'].includes(barrelFilter)) {
            return false;
        }

        // Suppressor filter
        if (suppressorFilter) {
            const suppressor = config['Suppressor Type'].toLowerCase();
            if (suppressorFilter === 'yes' && !suppressor.includes('yes')) return false;
            if (suppressorFilter === 'no' && suppressor !== 'no' && suppressor !== 'none') return false;
            if (suppressorFilter === 'both' && !suppressor.includes('both')) return false;
        }

        // Ammo filter
        if (ammoFilter) {
            const ammo = config['Ammo Type'].toLowerCase();
            if (ammoFilter === 'subsonic' && !ammo.includes('subsonic') && !ammo.includes('sub')) return false;
            if (ammoFilter === 'supersonic' && ammo.includes('subsonic')) return false;
            if (ammoFilter === 'both' && !ammo.includes('both')) return false;
        }

        // FRT filter
        if (frtFilter && config.FRT.toLowerCase() !== frtFilter) {
            return false;
        }

        return true;
    });

    renderTable(filtered);
}

// Reset filters
function resetFilters() {
    document.getElementById('filter-barrel').value = '';
    document.getElementById('filter-suppressor').value = '';
    document.getElementById('filter-ammo').value = '';
    document.getElementById('filter-frt').value = '';
    renderTable(allConfigs);
}

// Update count
function updateCount(count) {
    document.getElementById('count').textContent = count;
}

// Sort table
let sortDirection = {};
function sortTable(column) {
    sortDirection[column] = !sortDirection[column];
    const direction = sortDirection[column] ? 1 : -1;

    const currentFiltered = getCurrentlyDisplayedConfigs();
    
    currentFiltered.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle numeric sorting for buffer weight
        if (column === 'Buffer Weight (oz)') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        }

        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
        return 0;
    });

    renderTable(currentFiltered);
}

// Get currently displayed configs (after filters)
function getCurrentlyDisplayedConfigs() {
    // Re-apply filters to get current set
    const barrelFilter = document.getElementById('filter-barrel').value;
    const suppressorFilter = document.getElementById('filter-suppressor').value;
    const ammoFilter = document.getElementById('filter-ammo').value;
    const frtFilter = document.getElementById('filter-frt').value;

    if (!barrelFilter && !suppressorFilter && !ammoFilter && !frtFilter) {
        return [...allConfigs];
    }

    return allConfigs.filter(config => {
        if (barrelFilter && !config['Barrel Length'].includes(barrelFilter)) return false;
        if (suppressorFilter) {
            const suppressor = config['Suppressor Type'].toLowerCase();
            if (suppressorFilter === 'yes' && !suppressor.includes('yes')) return false;
            if (suppressorFilter === 'no' && suppressor !== 'no' && suppressor !== 'none') return false;
            if (suppressorFilter === 'both' && !suppressor.includes('both')) return false;
        }
        if (ammoFilter) {
            const ammo = config['Ammo Type'].toLowerCase();
            if (ammoFilter === 'subsonic' && !ammo.includes('subsonic') && !ammo.includes('sub')) return false;
            if (ammoFilter === 'supersonic' && ammo.includes('subsonic')) return false;
            if (ammoFilter === 'both' && !ammo.includes('both')) return false;
        }
        if (frtFilter && config.FRT.toLowerCase() !== frtFilter) return false;
        return true;
    });
}

// Show details modal
function showDetails(index) {
    const config = allConfigs[index];
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${config.Configuration}</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <dl>
                    <dt>Barrel Length</dt>
                    <dd>${config['Barrel Length']}</dd>
                    
                    <dt>Buffer Type</dt>
                    <dd>${config['Buffer Type']}</dd>
                    
                    <dt>Buffer Weight</dt>
                    <dd>${config['Buffer Weight (oz)']} oz</dd>
                    
                    <dt>Spring Type</dt>
                    <dd>${config['Spring Type']}</dd>
                    
                    <dt>Spring Rating</dt>
                    <dd>${config['Spring Rating']}</dd>
                    
                    <dt>Ammo Type</dt>
                    <dd>${config['Ammo Type']}</dd>
                    
                    <dt>Suppressor</dt>
                    <dd>${config['Suppressor Type']}</dd>
                    
                    <dt>FRT</dt>
                    <dd>${config.FRT}</dd>
                    
                    <dt>Source</dt>
                    <dd>${config.Source}</dd>
                    
                    <dt>Notes</dt>
                    <dd>${config.Notes || 'N/A'}</dd>
                </dl>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.querySelector('.close-modal'));
        }
    });
}

// Close modal
function closeModal(btn) {
    const modal = btn.closest('.modal');
    modal.remove();
}

// Build helper - get recommendation
function getRecommendation() {
    const barrel = document.getElementById('helper-barrel').value;
    const suppressed = document.getElementById('helper-suppressed').value;
    const ammo = document.getElementById('helper-ammo').value;
    const frt = document.getElementById('helper-frt').value;

    if (!barrel || !suppressed || !ammo || !frt) {
        alert('Please answer all questions');
        return;
    }

    const resultDiv = document.getElementById('recommendation-result');
    resultDiv.style.display = 'block';

    let recommendation = getRecommendationLogic(barrel, suppressed, ammo, frt);
    let matchingConfigs = findMatchingConfigs(barrel, suppressed, ammo, frt);

    resultDiv.innerHTML = `
        <h3>💡 Recommended Setup</h3>
        <div class="recommendation">
            <h4>Buffer: ${recommendation.buffer}</h4>
            <h4>Spring: ${recommendation.spring}</h4>
            <p><strong>Why:</strong> ${recommendation.reason}</p>
            ${recommendation.alternative ? `<p><strong>Alternative:</strong> ${recommendation.alternative}</p>` : ''}
        </div>

        ${matchingConfigs.length > 0 ? `
            <div class="matching-configs">
                <h4>Matching Configurations (${matchingConfigs.length})</h4>
                ${matchingConfigs.slice(0, 5).map(config => `
                    <div class="config-card">
                        <h5>${config.Configuration}</h5>
                        <p><strong>Buffer:</strong> ${config['Buffer Type']} (${config['Buffer Weight (oz)']} oz)</p>
                        <p><strong>Spring:</strong> ${config['Spring Type']}</p>
                        <p><strong>Notes:</strong> ${config.Notes || 'N/A'}</p>
                    </div>
                `).join('')}
                ${matchingConfigs.length > 5 ? `<p style="margin-top: 1rem; color: #666;">+ ${matchingConfigs.length - 5} more in the Browse tab</p>` : ''}
            </div>
        ` : ''}
    `;

    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Recommendation logic
function getRecommendationLogic(barrel, suppressed, ammo, frt) {
    // FRT + Suppressed
    if (frt === 'yes') {
        return {
            buffer: 'H2 (4.6 oz)',
            spring: 'Super42 or Enhanced (Sprinco Blue)',
            reason: 'FRT requires consistent bolt velocity. H2 buffer + enhanced spring provides reliable function across ammo types while maintaining proper timing.',
            alternative: 'Start with H2 + Super42. If overgassed, stay with H2 and tune gas block down.'
        };
    }

    // Suppressed subsonic only
    if (suppressed === 'yes' && ammo === 'subsonic') {
        return {
            buffer: 'H2 or H3 (4.6-5.4 oz)',
            spring: 'Standard Carbine',
            reason: 'H3 buffer significantly reduces fouling and recoil for suppressed subsonic-only builds. H2 works well too and offers more versatility if you change your mind about shooting supers.',
            alternative: 'Try H2 first. If gun runs dirty or has excessive blowback, upgrade to H3.'
        };
    }

    // Suppressed both sub/super
    if (suppressed === 'yes' && ammo === 'both') {
        if (barrel === '7.5-8') {
            return {
                buffer: 'H2 (4.6 oz)',
                spring: 'Standard Carbine or Sprinco Yellow',
                reason: 'H2 is the most versatile for 7.5-8" suppressed builds running both ammo types. Standard spring works for most, Sprinco Yellow if you have adjustable gas.',
                alternative: 'If you have an adjustable gas block, consider Carbine buffer + Sprinco Yellow and tune gas for subs first.'
            };
        }
        return {
            buffer: 'H2 (4.6 oz)',
            spring: 'Standard Carbine',
            reason: 'H2 + standard spring is the most common and reliable setup for suppressed builds running both subs and supers.',
            alternative: 'A5H2 + A5 spring works for everything without any tuning required.'
        };
    }

    // Suppressed both conditions (suppressed/unsuppressed)
    if (suppressed === 'both') {
        return {
            buffer: 'A5H2 or H2',
            spring: 'A5 Spring or Standard Carbine',
            reason: 'A5 buffer system is designed to work in all conditions without adjustment. If you don\'t want the A5 system, H2 + standard spring works but may need tuning.',
            alternative: 'If using standard buffer tube: H2 + standard spring, tune with adjustable gas block.'
        };
    }

    // Unsuppressed subsonic
    if (suppressed === 'no' && ammo === 'subsonic') {
        if (barrel === '16+') {
            return {
                buffer: 'Carbine (3.0 oz)',
                spring: 'Standard Carbine',
                reason: 'Long barrels need lighter buffers to reliably cycle subsonic ammo unsuppressed. Carbine buffer is AAC\'s recommendation for 16" unsuppressed subs.',
                alternative: 'May need adjustable gas block if using very light subsonic loads.'
            };
        }
        return {
            buffer: 'Carbine (3.0 oz)',
            spring: 'Standard Carbine',
            reason: 'Standard AR-15 parts work fine for unsuppressed subsonic. Keep it simple.',
            alternative: 'If cycling issues persist, add adjustable gas block before changing buffer.'
        };
    }

    // Unsuppressed both ammo types
    if (suppressed === 'no' && ammo === 'both') {
        if (barrel === '7.5-8') {
            return {
                buffer: 'Carbine or H (3.0-3.8 oz)',
                spring: 'Standard Carbine',
                reason: 'Short barrels unsuppressed can be finicky. Start with carbine buffer, move to H if overgassed with supers.',
                alternative: 'Adjustable gas block + carbine buffer lets you tune for reliability with both loads.'
            };
        }
        return {
            buffer: 'Carbine or H (3.0-3.8 oz)',
            spring: 'Standard Carbine',
            reason: 'Standard AR-15 parts are what .300 BLK was designed around. Carbine buffer + standard spring will work for most setups.',
            alternative: 'H buffer (3.8 oz) if you experience excessive blowback or overgassing with supersonic ammo.'
        };
    }

    // Unsuppressed supersonic only
    if (suppressed === 'no' && ammo === 'supersonic') {
        return {
            buffer: 'H (3.8 oz)',
            spring: 'Standard Carbine',
            reason: 'Supersonic-only builds can use slightly heavier buffer to tame the impulse. H buffer is a good middle ground.',
            alternative: 'Carbine buffer (3.0 oz) works fine too, especially if barrel is on the shorter side.'
        };
    }

    // Default fallback
    return {
        buffer: 'H2 (4.6 oz)',
        spring: 'Standard Carbine',
        reason: 'H2 + standard spring is the most versatile starting point for .300 BLK builds.',
        alternative: 'Adjust from here based on testing. Heavier if overgassed, lighter if short-stroking.'
    };
}

// Find matching configs
function findMatchingConfigs(barrel, suppressed, ammo, frt) {
    return allConfigs.filter(config => {
        // FRT match
        if (frt === 'yes' && config.FRT.toLowerCase() !== 'yes') return false;

        // Barrel match (approximate)
        const configBarrel = config['Barrel Length'].toLowerCase();
        if (barrel === '7.5-8' && !configBarrel.match(/7\.5|8\.|8"/)) return false;
        if (barrel === '8-10' && !configBarrel.match(/8\.|8"|9|10\.|10"/)) return false;
        if (barrel === '10-11' && !configBarrel.match(/10|11/)) return false;
        if (barrel === '16+' && !configBarrel.includes('16')) return false;

        // Suppressor match
        const configSuppressor = config['Suppressor Type'].toLowerCase();
        if (suppressed === 'yes' && !configSuppressor.includes('yes')) return false;
        if (suppressed === 'no' && configSuppressor !== 'no' && configSuppressor !== 'none') return false;
        if (suppressed === 'both' && !configSuppressor.includes('both')) return false;

        // Ammo match
        const configAmmo = config['Ammo Type'].toLowerCase();
        if (ammo === 'subsonic' && !configAmmo.includes('subsonic') && !configAmmo.includes('sub') && configAmmo !== 'both') return false;
        if (ammo === 'supersonic' && configAmmo.includes('subsonic') && !configAmmo.includes('both')) return false;
        if (ammo === 'both' && !configAmmo.includes('both')) return false;

        return true;
    });
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        configuration: `User Submission - ${new Date().toLocaleDateString()}`,
        barrelLength: document.getElementById('submit-barrel').value,
        bufferType: document.getElementById('submit-buffer').value,
        bufferWeight: document.getElementById('submit-buffer-weight').value || 'Unknown',
        springType: document.getElementById('submit-spring').value,
        ammoType: document.getElementById('submit-ammo').value,
        suppressorType: document.getElementById('submit-suppressor').value,
        suppressorModel: document.getElementById('submit-suppressor-model').value || 'N/A',
        frt: document.getElementById('submit-frt').value,
        status: document.getElementById('submit-status').value,
        notes: document.getElementById('submit-notes').value,
        source: document.getElementById('submit-source').value || 'Anonymous',
        timestamp: new Date().toISOString()
    };

    // Save to localStorage for now
    let submissions = JSON.parse(localStorage.getItem('bufferwiener-submissions') || '[]');
    submissions.push(formData);
    localStorage.setItem('bufferwiener-submissions', JSON.stringify(submissions));

    // Show success message
    const resultDiv = document.getElementById('submit-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h3>✅ Submission Received!</h3>
        <p>Thank you for contributing to the community database. Your configuration has been saved and will be reviewed for inclusion in the main database.</p>
        <p><strong>Total community submissions:</strong> ${submissions.length}</p>
    `;

    // Reset form
    document.getElementById('submit-form').reset();

    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

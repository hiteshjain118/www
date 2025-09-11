import React from 'react';
import { 
  ChatBubbleLeftRightIcon,
  WifiIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const DemoLaunchPromo: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h1 className="text-lg font-semibold text-gray-900">May Launch Promotions</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <WifiIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-600">Live Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$127,450</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+12.5%</span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Customers</p>
                <p className="text-2xl font-bold text-gray-900">2,847</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+8.2%</span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">4.2%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600 font-medium">-0.3%</span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">$89.50</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+5.7%</span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Daily Revenue</h3>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">May 1-31, 2025</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between space-x-1">
              {[45, 52, 48, 61, 55, 67, 73, 69, 76, 82, 78, 85, 91, 87, 94, 89, 96, 98, 92, 95, 88, 85, 90, 95, 88, 92, 96, 88, 95, 91, 88].map((height, index) => (
                <div key={index} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: `${height}%` }}></div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>May 1</span>
              <span>May 15</span>
              <span>May 31</span>
            </div>
          </div>

          {/* Customer Acquisition */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Acquisition Channels</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Email Campaign</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-900 mr-2">1,247</span>
                  <span className="text-xs text-gray-500">43.8%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '43.8%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Social Media</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-900 mr-2">892</span>
                  <span className="text-xs text-gray-500">31.3%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '31.3%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Paid Search</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-900 mr-2">456</span>
                  <span className="text-xs text-gray-500">16.0%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '16.0%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Referrals</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-900 mr-2">252</span>
                  <span className="text-xs text-gray-500">8.9%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '8.9%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Performance Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Spring Sale - Email</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">125,847</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8,945</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">6.8%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,247</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$89,450</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      485%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mother's Day - Social</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">89,234</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5,678</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5.2%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">892</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$67,200</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      387%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Flash Sale - Paid Search</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">156,789</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">7,234</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3.4%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">456</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$34,780</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      234%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Referral Program</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12,650</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3,456</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2.3%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">252</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$18,900</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      890%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoLaunchPromo; 